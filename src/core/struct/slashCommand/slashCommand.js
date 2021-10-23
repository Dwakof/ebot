'use strict';

const Hoek = require('@hapi/hoek');

const {
    ApplicationCommandOptionType,
    ApplicationCommandPermissionType,
    ApplicationCommandType
} = require('discord-api-types/v9');

const { AkairoModule } = require('discord-akairo');

module.exports = class SlashCommand extends AkairoModule {

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


    constructor(id, { description, category, global, defaultPermission, type }) {

        super(id, { description, category });

        this.name              = id;
        this.description       = description;
        this.global            = global ?? false;
        this.defaultPermission = defaultPermission ?? true;
        this.type              = type ?? SlashCommand.Types.RootCommand;

        Hoek.assert(this.name, 'The slash command class must have a name.');
        // Hoek.assert(this.description, 'The slash command class must have a description.');

        if (global) {

            Hoek.assert(!this.permissions, 'permissions() can not be implemented on a global slash command');
        }

        this.#command = {
            name               : this.name,
            description        : this.description,
            type               : this.type,
            default_permission : defaultPermission
        };

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

    setMethod(parent, command, { method : methodName, options = {} }) {

        let id;

        if ([SlashCommand.Types.RootCommand, SlashCommand.Types.MessageCommand, SlashCommand.Types.UserCommand].includes(parent.type)) {

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

        SlashCommand.setOptions(command, options);
        this.#methods.set(id, { method, options });
    }

    /**
     * @param {Object}               command
     * @param {ApplicationSubgroups} subcommands
     */
    subcommands(command, subcommands) {

        command.options = [];

        for (const [name, subcmd] of Object.entries(subcommands)) {

            const { description, method, options } = subcmd;

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

    get commands() {

        const result = {};

        for (const [key, { options }] of this.#methods) {

            result[key] = options;
        }

        return result;
    }

    get command() {

        return this.#command;
    }

    /**
     * @param id
     * @param interaction
     * @return {Promise}
     */
    runCommand(id, interaction) {

        if (!this.#methods.has(id)) {

            throw new Error(`Command ${ id } not found on SlashCommand ${ this.name } in category ${ this.categoryID }`);
        }

        return (this.#methods.get(id)).method(interaction);
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
     * @property {Boolean}                  [defaultPermission=true]
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
            RootCommand     : -1,
            UserCommand     : ApplicationCommandType.User,
            MessageCommand  : ApplicationCommandType.Message,
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

    static get Permission() {

        return {
            OWNERS       : 'owners',
            GUILD_OWNERS : 'guild_owners'
        };
    }

    static get PermissionTypes() {

        return {

            User : ApplicationCommandPermissionType.User,
            Role : ApplicationCommandPermissionType.Role
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

    /**
     * @param {Object}             command
     * @param {ApplicationOptions} applicationOptions
     */
    static setOptions(command, applicationOptions) {

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

    async buildPermissions(guild) {

        if (!this.permissions) {

            return [];
        }

        const permissions = [];

        for (const permission of await this.permissions(guild)) {

            if (permission === SlashCommand.Permission.OWNERS) {

                for (const ownerId of this.client.ownerID) {

                    permissions.push({ type : SlashCommand.PermissionTypes.User, id : ownerId, permission : true });
                }

                continue;
            }

            if (permission === SlashCommand.Permission.GUILD_OWNERS) {

                permissions.push({ type : SlashCommand.PermissionTypes.User, id : guild.ownerId, permission : true });

                continue;
            }

            permissions.push(permission);
        }

        return permissions.flat();
    }
};
