'use strict';

const { Routes }        = require('discord-api-types/v9');
const { AkairoHandler } = require('discord-akairo');

const { CoreEvents } = require('../../constants');

const SlashCommand = require('./slashCommand');

module.exports = class SlashCommandHandler extends AkairoHandler {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @typedef SlashCommandHandler.Command
     *
     * @property {SlashCommand}  slashCommand
     * @property {Array<String>} args
     */

    /**
     * @type {Map<String, SlashCommandHandler.Command>}
     */
    commands;

    constructor(client, {}) {

        super(client, { classToHandle : SlashCommand });

        this.client   = client;
        this.commands = new Map();

        this.setup();
    }

    setup() {

        this.client.once('ready', () => {

            this.client.on('interactionCreate', (interaction) => {

                if (!interaction.isCommand()) {

                    return;
                }

                return this.handle(interaction);
            });
        });
    }

    async registerCommands() {

        if (!this.client.settings.ebot.slashCommands.register) {

            return false;
        }

        const guildCommands  = [];
        const globalCommands = [];

        for (const [, { command, global }] of this.modules) {

            if (global) {

                globalCommands.push({ ...command, type : 1 });

                continue;
            }

            guildCommands.push({ ...command, type : 1, default_permission : command.default_permission ?? true });
        }

        try {

            for (const [guildId, guild] of this.client.guilds.cache) {

                const commands = await this.client.API.put(Routes.applicationGuildCommands(this.client.settings.discord.clientId, guildId), { body : guildCommands });

                const bulkPermissions = [];

                for (const command of commands) {

                    const commandPermission = { id : command.id, permissions : [] };

                    for (const perm of await this.modules.get(command.name).buildPermissions(guild)) {

                        commandPermission.permissions.push(perm);
                    }

                    bulkPermissions.push(commandPermission);
                }

                await this.client.API.put(Routes.guildApplicationCommandsPermissions(this.client.settings.discord.clientId, guildId), { body : bulkPermissions });
            }

            this.client.logger.info({
                event    : CoreEvents.GUILD_SLASH_COMMANDS_REGISTERED,
                emitter  : 'core',
                global   : false,
                module   : 'SlashCommandHandler',
                commands : guildCommands.map(({ name }) => name)
            });
        }
        catch (err) {

            if (err.status === 400) {

                this.client.logger.error({ err, errors : err.rawError.errors, commands : guildCommands, global : false });
            }

            throw err;
        }

        try {

            await this.client.API.put(Routes.applicationCommands(this.client.settings.discord.clientId), { body : globalCommands });

            this.client.logger.info({
                event    : CoreEvents.GLOBAL_SLASH_COMMANDS_REGISTERED,
                emitter  : 'core',
                global   : true,
                module   : 'SlashCommandHandler',
                commands : globalCommands.map(({ name }) => name)
            });
        }
        catch (err) {

            if (err.status === 400) {

                this.client.logger.error({ err, errors : err.rawError.errors, commands : globalCommands, global : true });
            }

            throw err;
        }

        return true;
    }

    /**
     * Registers a module.
     * @param {SlashCommand} slashCommand    - Module to use.
     * @param {string}       [filepath] - Filepath of module.
     * @returns {void}
     */
    register(slashCommand, filepath) {

        super.register(slashCommand, filepath);

        for (const [id, commandOptions] of Object.entries(slashCommand.commands)) {

            if (this.commands.has(id)) {

                throw new Error(`A command with the ID ${ id } is already registered`);
            }

            this.commands.set(id, { slashCommand, args : (commandOptions.options || []).map(({ name }) => name) });
        }
    }

    /**
     * @param {Interaction} interaction
     * @return {Promise<void>}
     */
    async handle(interaction) {

        let transaction;

        const { commandName, options } = interaction;

        const id = [commandName, options.getSubcommandGroup(false), options.getSubcommand(false)]
            .filter(Boolean).join('.');

        if (!this.commands.has(id)) {

            return;
        }

        const { slashCommand, args } = this.commands.get(id);

        try {

            if (this.client.sentry) {

                transaction = this.client.sentry.startTransaction({
                    op       : `slashCommand`,
                    name     : `[${ this.client.util.capitalize(slashCommand.categoryID) }] ${ id }`,
                    metadata : {
                        method : 'APPLICATION_COMMAND'
                    }
                });

                this.client.sentry.configureScope((scope) => {

                    scope.setContext('interaction', {
                        id        : interaction.id,
                        channelId : interaction.channelId,
                        guild     : interaction.member.guild.name,
                        guildId   : interaction.guildId
                    });

                    if (args.length > 0) {

                        scope.setContext('args', SlashCommandHandler.#parsingArgs(interaction, args));
                    }

                    scope.setUser({
                        id       : interaction.user.id,
                        username : `${ interaction.user.username }#${ interaction.user.discriminator }`
                    });

                    if (transaction) {

                        scope.setSpan(transaction);
                    }
                });
            }

            await slashCommand.runCommand(id, interaction);

            if (transaction) {

                transaction.status = 'ok';
            }
        }
        catch (error) {

            if (transaction) {

                transaction.status = 'unknown';
            }

            this.client.handleError(slashCommand, error, interaction);

            await this.client.util.send(interaction, 'Whoopsy, something went wrong with the command');
        }
        finally {

            if (transaction) {

                transaction.finish();
            }
        }
    }

    static #parsingArgs = (interaction, args = []) => {

        const result = {};

        for (const name of args) {

            const { type, value } = interaction.options.get(name);

            result[name] = { type : type.toLowerCase(), value };
        }

        return result;
    };
};
