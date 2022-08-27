'use strict';

const DeepEqual = require('fast-deep-equal');

// eslint-disable-next-line no-unused-vars
const { BaseInteraction, AutocompleteInteraction, BaseCommandInteraction, CommandInteraction, InteractionType } = require('discord.js');

const { Routes }        = require('discord-api-types/v10');
const { AkairoHandler } = require('discord-akairo');

const Util           = require('../../util');
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

        const guildCommands  = [];
        const globalCommands = [];

        for (const [, { command, global }] of this.modules) {

            if (global) {

                globalCommands.push({ ...command });

                continue;
            }

            guildCommands.push({ ...command });
        }

        await this.registerGlobalCommands(globalCommands);
        await this.registerGuildCommands(guildCommands, globalCommands);

        return true;
    }

    async registerGlobalCommands(commands) {

        try {

            const currents = await this.client.API.get(Routes.applicationCommands(this.client.clientId));

            const { add, remove, update, same, noChange } = this.diffCommands(commands, currents);

            if (noChange) {

                this.client.logger.info({
                    msg     : `${ commands.length } application commands were registered globally without update required`,
                    event   : CoreEvents.GLOBAL_APPLICATION_COMMANDS_REGISTERED,
                    emitter : 'core'
                });

                return;
            }

            const body = [...add, ...update, ...same];

            await this.client.API.put(Routes.applicationCommands(this.client.clientId), { body });

            this.client.logger.info({
                msg     : `${ body.length } application commands were registered globally (added=${ add.length }, updated=${ update.length }, removed=${ remove.length })`,
                event   : CoreEvents.GLOBAL_APPLICATION_COMMANDS_REGISTERED,
                emitter : 'core'
            });
        }
        catch (err) {

            if (err.status >= 400) {

                this.client.logger.error({ err, errors : err.rawError.errors, commands, global : true });
            }

            throw err;
        }
    }

    async registerGuildCommands(commands, globalCommands) {

        try {

            for (const [guildId, { name }] of this.client.guilds.cache) {

                const currents = await this.client.API.get(Routes.applicationCommands(this.client.clientId));

                const { add, remove, update, same, noChange } = this.diffCommands(commands, Util.leftExclusiveJoin(currents, globalCommands, (c) => c.name));

                if (noChange) {

                    this.client.logger.info({
                        msg     : `${ commands.length } application commands were registered for guild "${ name }" (${ guildId }) without update required`,
                        event   : CoreEvents.GUILD_APPLICATION_COMMANDS_REGISTERED,
                        emitter : 'core'
                    });

                    continue;
                }

                const body = [...add, ...update, ...same];

                await this.client.API.put(Routes.applicationGuildCommands(this.client.clientId, guildId), { body });

                this.client.logger.info({
                    msg     : `${ body.length } application commands were registered for guild "${ name }" (${ guildId }) (added=${ add.length }, updated=${ update.length }, removed=${ remove.length })`,
                    event   : CoreEvents.GUILD_APPLICATION_COMMANDS_REGISTERED,
                    emitter : 'core'
                });
            }
        }
        catch (err) {

            if (err.status >= 400) {

                this.client.logger.error({ err, errors : err.rawError.errors, commands, global : true });
            }

            throw err;
        }
    }

    diffCommands(commands, currents) {

        const predicate = ({ name }) => name;

        const commandMap = Util.toMap(commands, predicate);
        const currentMap = Util.toMap(currents, predicate);

        const commandNames = Array.from(commandMap.keys());
        const currentNames = Array.from(currentMap.keys());

        const add    = Util.leftExclusiveJoin(commandNames, currentNames).map((name) => commandMap.get(name));
        const remove = Util.rightExclusiveJoin(commandNames, currentNames).map((name) => currentMap.get(name));

        const { same, update } = Util.innerExclusiveJoin(commandNames, currentNames).reduce((result, name) => {

            // eslint-disable-next-line no-unused-vars
            const { id, application_id, version, ...current } = currentMap.get(name);
            const command                                     = commandMap.get(name);

            if (DeepEqual(command, current)) {

                result.same.push(current);
            }
            else {

                result.update.push({ id, application_id, ...command });
            }

            return result;

        }, { same : [], update : [] });

        return { add, remove, update, same, noChange : !(add.length || remove.length || update.length) };
    }

    /**
     * @param {Boolean}  global
     *
     * @return {[String, {applicationCommand: ApplicationCommand, args: Array<String>}]}
     */
    getCommandsArray(global = true) {

        return Array.from(this.commands.entries()).reduce((acc, [key, { applicationCommand : { global : value } }]) => {

            if (global === value) {

                return [...acc, key];
            }

            return acc;
        }, []);
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
     * @param {BaseInteraction|AutocompleteInteraction|BaseCommandInteraction|CommandInteraction} interaction
     *
     * @return {Promise<void>}
     */
    async handle(interaction) {

        let transaction;

        const { commandName, options } = interaction;

        if (!commandName) {

            return;
        }

        const id = [commandName, options.getSubcommandGroup(false), options.getSubcommand(false)]
            .filter(Boolean).join('.');

        if (!this.commands.has(id)) {

            const error = new Error(`This command id "${ id }" was not found`);

            this.emit(ApplicationCommandHandler.Events.ERROR, error, interaction);

            return;
        }

        const { applicationCommand, args } = this.commands.get(id);

        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {

            await applicationCommand.runAutocomplete(id, interaction);

            return;
        }

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

            const reply = await applicationCommand.runCommand(id, interaction);

            if (reply instanceof Util.InteractiveReply || reply instanceof Util.Modal) {

                await reply.send();
            }

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

            this.client.handleError(applicationCommand, error);

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
