'use strict';

const Hoek = require('@hapi/hoek');

const { ApplicationCommandOptionType, Routes } = require('discord-api-types/v9');

/**
 * Represents a slash command.
 *
 * @param {EbotClient} client - The Ebot client.
 */
module.exports = class SlashCommand {

    static #RootCommand = -1;

    name        = null;
    description = null;

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * The actual command object
     * @type {Object}
     */
    #command;

    /**
     * @typedef {Object} Method
     *
     * @property {Function<Promise>}  method
     * @property {ApplicationOptions} options
     */

    /**
     * @type {Map<String, Method>}
     */
    #methods = new Map();

    /**
     * @param {EbotClient} client
     */
    constructor(client) {

        this.client      = client;
        this.name        = this.constructor.name;
        this.description = this.constructor.description;

        Hoek.assert(this.name, 'The slash command class must have a name.');
        Hoek.assert(this.description, 'The slash command class must have a description.');

        this.#command = { name : this.name, description : this.description, type : SlashCommand.#RootCommand };

        if (this.constructor.command) {

            Hoek.assert(!this.constructor.subcommands, `The slash command class can't have both command and subcommands set`);
            Hoek.assert(!this.constructor.subgroups, `The slash command class can't have both command and subgroups set`);

            this.setMethod(this.#command, this.#command, this.constructor.command);
        }

        if (this.constructor.subcommands) {

            Hoek.assert(!this.constructor.command, `The slash command class can't have both subcommands and command set`);
            Hoek.assert(!this.constructor.subgroups, `The slash command class can't have both subcommands and subgroups set`);

            this.subcommands(this.#command, this.constructor.subcommands);
        }

        if (this.constructor.subgroups) {

            Hoek.assert(!this.constructor.command, `The slash command class can't have both subgroups and command set`);
            Hoek.assert(!this.constructor.subcommands, `The slash command class can't have both subgroups and subcommands set`);

            this.subgroups(this.constructor.subgroups);
        }
    }

    setMethod(parent, command, { method : methodName, options }) {

        let id;

        if (parent.type === SlashCommand.#RootCommand) {

            id = command.name;
        }

        if (command.type === SlashCommand.Types.Subcommand) {

            id = `${ parent.name }.${ command.name }`;
        }

        if (parent.type === SlashCommand.Types.SubcommandGroup) {

            id = `${ this.name }.${ parent.name }.${ command.name }`;
        }

        Hoek.assert(typeof this[methodName] === 'function', `The method ${ methodName } for command ${ id } does not exist`);

        const method = (interaction) => {

            return this[methodName](interaction, SlashCommand.#parsingArgs(interaction, options));
        };

        this.setOptions(command, options);
        this.#methods.set(id, { method, options });
    }

    /**
     * @param {Object}             command
     * @param {ApplicationOptions} applicationOptions
     */
    setOptions(command, applicationOptions) {

        command.options = [];

        for (const [name, { description, type, required = false, choices }] of Object.entries(applicationOptions)) {

            const option = { name, description, required, type };

            if (choices) {

                if (
                    ![
                        SlashCommand.Types.String,
                        SlashCommand.Types.Integer,
                        SlashCommand.Types.Number
                    ].includes(type)
                ) {

                    throw new Error(`Choices are only available for types String, Integer or Number`);
                }

                option.choices = [];

                for (const [key, value] of Object.entries(choices)) {

                    option.choices.push({ name : key, value });
                }
            }

            command.options.push(option);
        }
    }

    /**
     * @param {Object}               command
     * @param {ApplicationSubgroups} subcommands
     */
    subcommands(command, subcommands) {

        command.options = [];

        for (const [name, { description, method, options = {} }] of Object.entries(subcommands)) {

            const subcommand = { name, description, type : SlashCommand.Types.Subcommand };

            this.setMethod(command, subcommand, { method, options });

            command.options.push(subcommand);
        }
    }

    /**
     * @param {ApplicationSubgroups} subgroups
     */
    subgroups(subgroups) {

        this.#command.options = [];

        for (const [name, { description, subcommands }] of Object.entries(this.constructor.subgroups)) {

            const subgroup = { name, description, type : SlashCommand.Types.SubcommandGroup };

            this.subcommands(subgroup, subcommands);

            this.#command.options.push(subgroup);
        }
    }

    async init() {

        this.#command.type = 1;

        const body = [this.#command];

        try {

            for (const guildId of this.client.settings.ebot.slashCommands.registerGuilds) {

                await this.client.API.put(Routes.applicationGuildCommands(this.client.settings.discord.clientId, guildId), { body });
            }

            if (this.client.settings.ebot.slashCommands.registerGlobal) {

                await this.client.API.put(Routes.applicationCommands(this.client.settings.discord.clientId), { body });
            }
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

        this.client.on('interactionCreate', (interaction) => {

            if (!interaction.isCommand()) {

                return;
            }

            const id = [
                interaction.commandName,
                interaction.options.getSubcommandGroup(false),
                interaction.options.getSubcommand(false)
            ].filter(Boolean).join('.');

            if (this.#methods.has(id)) {

                return (this.#methods.get(id)).method(interaction);
            }
        });
    }

    /**
     * @typedef {Object} ApplicationOption
     *
     * @property {ApplicationCommandOptionType}    type
     * @property {String}                          description
     * @property {Boolean}                         [required]
     * @property {Object<String, (String|Number)>} [choices]
     */

    /**
     * @typedef {Object<String, ApplicationOption>} ApplicationOptions
     */

    /**
     * @typedef {Object} ApplicationCommand
     *
     * @property {String}                   method
     * @property {String}                   description
     * @property {ApplicationOptions}       [options]
     */

    /**
     * @typedef {Object<String, ApplicationCommand>} ApplicationCommands
     */

    /**
     * @typedef {Object} ApplicationSubcommand
     *
     * @property {String}              description
     * @property {ApplicationCommands} [commands]
     */

    /**
     * @typedef {Object<String, ApplicationSubcommand>} ApplicationSubcommands
     */

    /**
     * @typedef {Object} ApplicationSubgroup
     *
     * @property {String}               description
     * @property ApplicationSubcommands [subcommands]
     */

    /**
     * @typedef {Object<String, ApplicationSubgroup>} ApplicationSubgroups
     */

    /**
     * @type {Object}
     *
     * @property {String}                   method
     * @property {ApplicationOptions}       [options]
     */
    static command;

    /**
     * @type {ApplicationSubcommands}
     */
    static subcommands;

    /**
     * @type {ApplicationSubgroups}
     */
    static subgroups;

    static get Types() {

        return {
            Subcommand      : ApplicationCommandOptionType.Subcommand,
            SubcommandGroup : ApplicationCommandOptionType.SubcommandGroup,
            String          : ApplicationCommandOptionType.String,
            Integer         : ApplicationCommandOptionType.Integer,
            Boolean         : ApplicationCommandOptionType.Boolean,
            User            : ApplicationCommandOptionType.User,
            Member          : ApplicationCommandOptionType.User,
            Channel         : ApplicationCommandOptionType.Channel,
            Role            : ApplicationCommandOptionType.Role,
            Mentionable     : ApplicationCommandOptionType.Mentionable,
            Number          : ApplicationCommandOptionType.Number
        };
    }

    static #parsingArgs = (interaction, commandOptions) => {

        const result = {};

        for (const [name, { type }] of Object.entries(commandOptions)) {

            switch (type) {
                case SlashCommand.Types.String:

                    result[name] = interaction.options.getString(name);

                    break;
                case SlashCommand.Types.Integer:

                    result[name] = interaction.options.getInteger(name);

                    break;
                case SlashCommand.Types.Number:

                    result[name] = interaction.options.getNumber(name);

                    break;
                case SlashCommand.Types.Boolean:

                    result[name] = interaction.options.getBoolean(name);

                    break;
                case SlashCommand.Types.User:

                    result[name] = interaction.options.getUser(name);

                    break;
                case SlashCommand.Types.Member:

                    result[name] = interaction.options.getMember(name);

                    break;
                case SlashCommand.Types.Channel:

                    result[name] = interaction.options.getChannel(name);

                    break;
                case SlashCommand.Types.Role:

                    result[name] = interaction.options.getRole(name);

                    break;
                case SlashCommand.Types.Mentionable:

                    result[name] = interaction.options.getMentionable(name);

                    break;
            }
        }

        return result;
    };
};
