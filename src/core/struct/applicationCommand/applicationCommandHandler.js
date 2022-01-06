'use strict';

const { Routes }        = require('discord-api-types/v9');
const { AkairoHandler } = require('discord-akairo');

const { CoreEvents } = require('../../constants');

const ApplicationCommand = require('./applicationCommand');

module.exports = class ApplicationCommandHandler extends AkairoHandler {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @typedef ApplicationCommandHandler.Command
     *
     * @property {ApplicationCommand}  applicationCommand
     * @property {Array<String>}       args
     */

    /**
     * @type {Map<String, ApplicationCommandHandler.Command>}
     */
    commands;

    constructor(client, {}) {

        super(client, { classToHandle : ApplicationCommand });

        this.client   = client;
        this.commands = new Map();

        this.setup();
    }

    setup() {

        this.client.once('ready', () => {

            this.client.on('interactionCreate', (interaction) => {

                return this.handle(interaction);
            });
        });
    }

    async registerCommands() {

        if (!this.client.settings.ebot.applicationCommands.register) {

            return false;
        }

        const guildCommands  = [];
        const globalCommands = [];

        for (const [, { command, global }] of this.modules) {

            if (global) {

                globalCommands.push(command);

                continue;
            }

            guildCommands.push({ ...command, default_permission : command.default_permission ?? true });
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
                event    : CoreEvents.GUILD_APPLICATION_COMMANDS_REGISTERED,
                emitter  : 'core',
                global   : false,
                module   : 'ApplicationCommandHandler',
                commands : Array.from(this.commands.entries()).reduce((acc, [key, { applicationCommand : { global } }]) => {

                    if (global) {

                        return acc;
                    }

                    return [...acc, key];
                }, [])
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
                event    : CoreEvents.GLOBAL_APPLICATION_COMMANDS_REGISTERED,
                emitter  : 'core',
                global   : true,
                module   : 'ApplicationCommandHandler',
                commands : Array.from(this.commands.entries()).reduce((acc, [key, { applicationCommand : { global } }]) => {

                    if (!global) {

                        return acc;
                    }

                    return [...acc, key];
                }, [])
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
     * @param {ApplicationCommand}  applicationCommand  - Module to use.
     * @param {string}              [filepath]          - Filepath of module.
     *
     * @returns {void}
     */
    register(applicationCommand, filepath) {

        super.register(applicationCommand, filepath);

        for (const [id, commandOptions] of Object.entries(applicationCommand.commands)) {

            if (this.commands.has(id)) {

                throw new Error(`A command with the ID ${ id } is already registered`);
            }

            this.commands.set(id, { applicationCommand, args : (commandOptions.options || []).map(({ name }) => name) });
        }
    }

    /**
     * @param {Interaction} interaction
     *
     * @return {Promise<void>}
     */
    async handle(interaction) {

        let transaction;

        const { commandName, options } = interaction;

        const id = [commandName, options.getSubcommandGroup(false), options.getSubcommand(false)]
            .filter(Boolean).join('.');

        if (!this.commands.has(id)) {

            const error = new Error(`This command id "${ id }" was not found`);

            this.emit(ApplicationCommandHandler.Events.ERROR, error, interaction);

            return;
        }

        const { applicationCommand, args } = this.commands.get(id);

        try {

            if (this.client.sentry) {

                transaction = this.client.sentry.startTransaction({
                    op       : `applicationCommand`,
                    name     : `[${ this.client.util.capitalize(applicationCommand.categoryID) }] ${ id }`,
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

                        scope.setContext('args', ApplicationCommandHandler.#parsingArgs(interaction, args));
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

            this.emit(ApplicationCommandHandler.Events.COMMAND_STARTED, interaction, applicationCommand);

            await applicationCommand.runCommand(id, interaction);

            this.emit(ApplicationCommandHandler.Events.COMMAND_FINISHED, interaction, applicationCommand);

            if (transaction) {

                transaction.status = 'ok';
            }
        }
        catch (error) {

            if (transaction) {

                transaction.status = 'unknown';
            }

            this.emit(ApplicationCommandHandler.Events.ERROR, error, interaction, applicationCommand);

            this.client.handleError(applicationCommand, error, interaction);

            await this.client.util.send(interaction, 'Whoopsy, something went wrong with the command');
        }
        finally {

            if (transaction) {

                transaction.finish();
            }
        }
    }

    static #parsingArgs(interaction, args = []) {

        const result = {};

        for (const name of args) {

            const { type, value } = interaction.options.get(name);

            result[name] = { type : type.toLowerCase(), value };
        }

        return result;
    }

    static get Events() {

        return {
            COMMAND_STARTED   : 'applicationCommandStarted',
            COMMAND_FINISHED  : 'applicationCommandFinished',
            COMMAND_CANCELLED : 'applicationCommandCancelled',
            ERROR             : 'error'
        };
    }
};
