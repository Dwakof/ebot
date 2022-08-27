'use strict';

const Hoek = require('@hapi/hoek');

const { ApplicationCommandOptionType, ApplicationCommandType } = require('discord-api-types/v10');

// eslint-disable-next-line no-unused-vars
const { AutocompleteInteraction, CommandInteraction, PermissionFlagsBits } = require('discord.js');

const { AkairoModule } = require('discord-akairo');

const Util = require('../../util');

const RootCommand = Symbol('RootCommand');

/**
 * @typedef {AkairoModule} ApplicationCommand
 */
module.exports = class ApplicationCommand extends AkairoModule {

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
     * @param {String}  id
     * @param {String}  description
     * @param {String}  category
     * @param {Boolean} [global=true]
     * @param {String}  [type='ChatInput']
     * @param {Boolean} [dm=false]
     * @param {BigInt}  [permissions=[SendMessages]]
     */
    constructor(id, { description, category, global, type, dm, permissions } = {}) {

        super(id, { category });

        this.name          = id;
        this.description   = description ?? '';
        this.global        = global ?? true;
        this.directMessage = dm ?? false;
        this.permissions   = permissions?.toString() ?? PermissionFlagsBits.SendMessages.toString();
        this.type          = type ?? ApplicationCommand.Types.SlashCommand;

        Hoek.assert(this.name, 'The application command class must have a name.');

        if (this.type === ApplicationCommand.Types.SlashCommand) {

            Hoek.assert(this.description, 'The application command class must have a description.');
        }

        this.#command = {
            root                       : RootCommand,
            name                       : this.name,
            type                       : this.type,
            description                : this.description,
            dm_permission              : this.directMessage,
            default_member_permissions : this.permissions,
            default_permission         : true
        };

        if (this.type !== ApplicationCommand.Types.SlashCommand) {

            Hoek.assert(!this.constructor.subgroups, `A Non-Slash application command cannot have a subgroup`);
            Hoek.assert(!this.constructor.subcommands, `A Non-Slash application command cannot have a subcommands`);

            this.#setMethod(this.#command, this.#command, this.constructor.command);
        }

        if (this.type === ApplicationCommand.Types.SlashCommand) {

            if (this.constructor.command) {

                Hoek.assert(!this.constructor.subcommands, `The application command class can't have both command and subcommands set`);
                Hoek.assert(!this.constructor.subgroups, `The application command class can't have both command and subgroups set`);

                this.#setMethod(this.#command, this.#command, this.constructor.command);
            }

            if (this.constructor.subcommands) {

                Hoek.assert(!this.constructor.command, `The application command class can't have both subcommands and command set`);
                Hoek.assert(!this.constructor.subgroups, `The application command class can't have both subcommands and subgroups set`);

                this.#subcommands(this.#command, this.constructor.subcommands);
            }

            if (this.constructor.subgroups) {

                Hoek.assert(!this.constructor.command, `The application command class can't have both subgroups and command set`);
                Hoek.assert(!this.constructor.subcommands, `The application command class can't have both subgroups and subcommands set`);

                this.#subgroups(this.constructor.subgroups);
            }
        }

        this.#command = JSON.parse(JSON.stringify(this.#command)); // Dirty hack to remove everything that is undefined on the object for applicationCommandHandler deepEqual with API values
    }

    #setMethod(parent, command, { method : methodName, options = {} }) {

        let id;

        if (parent.root === RootCommand && command.root === RootCommand) {

            id = command.name;
        }

        if (command.root !== RootCommand && command.type === ApplicationCommand.SubTypes.Subcommand) {

            id = `${ this.name }.${ command.name }`;
        }

        if (command.root !== RootCommand && parent.type === ApplicationCommand.SubTypes.SubcommandGroup) {

            id = `${ this.name }.${ parent.name }.${ command.name }`;
        }

        Hoek.assert(typeof this[methodName] === 'function', `The method ${ methodName } for command ${ id } does not exist`);

        const method = (interaction) => {

            return this[methodName](interaction, ApplicationCommand.#parsingArgs(interaction, options));
        };

        ApplicationCommand.#setOptions(command, options);

        this.#setAutocomplete(command, options);

        this.#methods.set(id, { method, options });
    }

    /**
     * @param {Object}               command
     * @param {ApplicationSubgroups} subcommands
     */
    #subcommands(command, subcommands) {

        command.options = [];

        for (const [name, subcmd] of Object.entries(subcommands)) {

            const { description, method, options } = subcmd;

            const subcommand = { name, description, type : ApplicationCommand.SubTypes.Subcommand };

            this.#setMethod(command, subcommand, { method, options });

            command.options.push(subcommand);
        }
    }

    /**
     * @param {ApplicationSubgroups} subgroups
     */
    #subgroups(subgroups) {

        this.#command.options = [];

        for (const [name, { description, subcommands, method, options }] of Object.entries(this.constructor.subgroups)) {

            const entity = { name, description };

            if (subcommands) {

                entity.type = ApplicationCommand.SubTypes.SubcommandGroup;

                this.#subcommands(entity, subcommands);
            }

            if (method) {

                entity.type = ApplicationCommand.SubTypes.Subcommand;

                this.#setMethod(subgroups, entity, { method, options });
            }

            this.#command.options.push(entity);
        }
    }

    get commands() {

        const result = {};

        for (const [key, { options }] of this.#methods) {

            result[key] = options;
        }

        return result;
    }

    get command() {

        // eslint-disable-next-line no-unused-vars
        const { root, ...command } = this.#command;

        return command;
    }

    /**
     * @param id
     * @param {CommandInteraction} interaction
     * @return {Promise}
     */
    runCommand(id, interaction) {

        if (!this.#methods.has(id)) {

            throw new Error(`Command ${ id } not found on ApplicationCommand ${ this.name } in category ${ this.categoryID }`);
        }

        return this.#methods.get(id).method(interaction);
    }

    /**
     * @param id
     * @param {AutocompleteInteraction} interaction
     * @return {Promise}
     */
    async runAutocomplete(id, interaction) {

        if (!this.#methods.has(id)) {

            throw new Error(`Command ${ id } not found on ApplicationCommand ${ this.name } in category ${ this.categoryID }`);
        }

        const { options = {} } = this.#methods.get(id);

        const { name } = interaction.options.getFocused(true);

        if (!options[name]) {

            return Promise.resolve();
        }

        try {

            await options[name].autocomplete(interaction);
        }
        catch (error) {

            this.client.logger.error({ err : error, msg : `Error when replying to autocomplete interaction for command ${ id } on parameter ${ name }` });
        }
    }

    /**
     * @typedef {Object} ApplicationOption
     *
     * @property {ApplicationCommandOptionType}    type
     * @property {String}                          description
     * @property {Boolean}                         [required]
     * @property {Object<String, (String|Number)>} [choices]
     * @property {Function|String}                 [autocomplete]
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
     * @typedef {Object<String, ApplicationSubcommand|ApplicationCommand>} ApplicationSubcommands
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
            SlashCommand   : ApplicationCommandType.ChatInput,
            UserCommand    : ApplicationCommandType.User,
            MessageCommand : ApplicationCommandType.Message
        };
    }

    static get SubTypes() {

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
            Number          : ApplicationCommandOptionType.Number,
            Attachment      : ApplicationCommandOptionType.Attachment
        };
    }

    static #parsingArgs = (interaction, commandOptions) => {

        const result = {};

        for (const [name, { type, default : defaultValue }] of Object.entries(commandOptions)) {

            switch (type) {
                case ApplicationCommand.SubTypes.String:

                    result[name] = interaction.options.getString(name);

                    break;
                case ApplicationCommand.SubTypes.Integer:

                    result[name] = interaction.options.getInteger(name);

                    break;
                case ApplicationCommand.SubTypes.Number:

                    result[name] = interaction.options.getNumber(name);

                    break;
                case ApplicationCommand.SubTypes.Boolean:

                    result[name] = interaction.options.getBoolean(name);

                    break;
                case ApplicationCommand.SubTypes.User:

                    result[name] = interaction.options.getUser(name);

                    break;
                case ApplicationCommand.SubTypes.Member:

                    result[name] = interaction.options.getMember(name);

                    break;
                case ApplicationCommand.SubTypes.Channel:

                    result[name] = interaction.options.getChannel(name);

                    break;
                case ApplicationCommand.SubTypes.Role:

                    result[name] = interaction.options.getRole(name);

                    break;
                case ApplicationCommand.SubTypes.Mentionable:

                    result[name] = interaction.options.getMentionable(name);

                    break;
                case ApplicationCommand.SubTypes.Attachment:

                    result[name] = interaction.options.getAttachment(name);

                    break;
            }

            result[name] = result[name] ?? defaultValue;
        }

        return result;
    };

    /**
     * @param {Object}             command
     * @param {ApplicationOptions} applicationOptions
     */
    static #setOptions(command, applicationOptions = {}) {

        const entries = Object.entries(applicationOptions);

        if (entries.length === 0) {

            return;
        }

        command.options = [];

        for (const [name, { description, type, required, choices, autocomplete, min_value, max_value }] of entries) {

            const option = { name, description, required, type, min_value, max_value };

            if (!required) {

                option.required = undefined;
            }

            if (autocomplete && choices) {

                throw new Error(`Choices cannot be used with autocomplete option.`);
            }

            if (autocomplete) {

                if (![ApplicationCommand.SubTypes.String, ApplicationCommand.SubTypes.Integer, ApplicationCommand.SubTypes.Number].includes(type)) {

                    throw new Error(`Autocomplete are only available for types String, Integer or Number`);
                }

                option.autocomplete = true;
            }

            if (choices) {

                if (![ApplicationCommand.SubTypes.String, ApplicationCommand.SubTypes.Integer, ApplicationCommand.SubTypes.Number].includes(type)) {

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

    #setAutocomplete(command, applicationOptions) {

        for (const [, option] of Object.entries(applicationOptions)) {

            if (option.autocomplete) {

                if (Util.isString(option.autocomplete)) {

                    Hoek.assert(Util.isFunction(this[option.autocomplete]), `Autocomplete "${ option.autocomplete }" does not exist or is not a function in ApplicationCommand ${ this.name } in category ${ this.categoryID }`);

                    option.autocomplete = this[option.autocomplete];
                }

                const method = option.autocomplete;

                option.autocomplete = (interaction) => {

                    return method.call(this, interaction, ApplicationCommand.#parsingArgs(interaction, applicationOptions));
                };
            }
        }
    }

    services(module = this.categoryID) {

        return this.client.services(module);
    }

    views(module = this.categoryID) {

        return this.client.views(module);
    }

    /**
     * @deprecated
     */
    providers(module = this.categoryID) {

        return this.client.providers(module);
    }

    /**
     * @deprecated
     */
    get store() {

        return this.client.store(this.categoryID);
    }
};
