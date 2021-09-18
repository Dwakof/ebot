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

        const body = [];

        for (const [, { command }] of this.modules) {

            body.push({ ...command, type : 1 });
        }

        try {

            if (this.client.settings.ebot.slashCommands.registerGuilds.length > 0) {

                for (const guildId of this.client.settings.ebot.slashCommands.registerGuilds) {

                    await this.client.API.put(Routes.applicationGuildCommands(this.client.settings.discord.clientId, guildId), { body });
                }

                this.client.logger.info({
                    event    : CoreEvents.SLASH_COMMANDS_REGISTERED,
                    emitter  : 'core',
                    global   : false,
                    module   : 'SlashCommandHandler',
                    commands : body.map(({ name }) => name)
                });

                return true;
            }

            await this.client.API.put(Routes.applicationCommands(this.client.settings.discord.clientId), { body });

            for (const guildId of this.client.guilds.cache.map(({ id }) => id)) {

                await this.client.API.put(Routes.applicationGuildCommands(this.client.settings.discord.clientId, guildId), { body : [] });
            }

            this.client.logger.info({
                event    : CoreEvents.SLASH_COMMANDS_REGISTERED,
                emitter  : 'core',
                global   : true,
                module   : 'SlashCommandHandler',
                commands : body.map(({ name }) => name)
            });

            return true;
        }
        catch (error) {

            if (error.status === 400) {

                this.client.logger.error({
                    errors   : error.rawError.errors,
                    commands : body
                });
            }

            throw error;
        }
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
