'use strict';

const Sentry  = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const Path = require('path');
const Pino = require('pino');
const Hoek = require('@hapi/hoek');
const Fs   = require('fs/promises');

const { GatewayIntentBits, PermissionsBitField } = require('discord.js');
const { REST }                                   = require('@discordjs/rest');
const { OAuth2Scopes }                           = require('discord-api-types/v10');

const { AkairoClient, InhibitorHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants');

const CommandHandler            = require('./struct/command/commandHandler');
const ApplicationCommandHandler = require('./struct/applicationCommand/applicationCommandHandler');
const ListenerHandler           = require('./struct/listener/listenerHandler');
const Module                    = require('./struct/module');

const ClientUtil = require('./clientUtil');

module.exports = class EbotClient extends AkairoClient {

    #settings;

    #initialized = false;
    #started     = false;

    #logger;
    #sentry;

    #coreListenerHandlers = new Map();

    #commandHandler;
    #applicationCommandHandler;
    #inhibitorHandler;
    #listenerHandler;

    #modules = new Map();

    constructor(settings) {

        super({ ownerID : settings.core.discord.ownerID }, {
            ...settings.core.discord,
            intents : [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.GuildMessageReactions
            ]
        });

        this.#settings = settings;

        this.util = new ClientUtil(this);
        this.API  = new REST({ version : '10' }).setToken(this.#settings.core.discord.token);

        this.#logger = Pino(this.#settings.core.logger);

        if (this.#settings.core.sentry.enabled) {

            Sentry.init({
                ...this.#settings.core.sentry,
                integrations : [
                    new Sentry.Integrations.Http({ tracing : true }),
                    new Tracing.Integrations.Postgres()
                ]
            });

            this.#sentry = Sentry;

            this.logger.info({ msg : 'Sentry is initialized', event : CoreEvents.SENTRY_INITIALIZED, emitter : 'core' });
        }
    }

    async #setupCoreListenerHandlers() {

        const rootPath = Path.join(__dirname, 'listeners');

        for (const handler of await Fs.readdir(rootPath)) {

            this.#coreListenerHandlers.set(handler, new ListenerHandler(this, { directory : Path.join(rootPath, handler) }));
        }

        this.#coreListenerHandlers.get('process').setEmitters({ process, api : this.API, rest : this.rest });
    }

    registerCommandHandler(settings) {

        this.#commandHandler = new CommandHandler(this, Hoek.merge({
            argumentDefaults    : {
                prompt : {
                    timeout : 'Time ran out, command has been cancelled.',
                    ended   : 'Too many retries, command has been cancelled.',
                    retry   : 'Could not find your argument, please try again! Say `cancel` to stop the command',
                    cancel  : 'Command has been cancelled.',
                    retries : 4,
                    time    : 30000
                }
            },
            commandUtil         : true,
            commandUtilLifetime : 60000,
            allowMention        : true,
            handleEdits         : true,
            ignorePermissions   : this.#settings.core.discord.ownerId,
            ignoreCooldown      : this.#settings.core.discord.ownerId,
            prefix              : this.#settings.core.discord.prefix

        }, settings));

        this.#coreListenerHandlers.get('command').setEmitters({ handler : this.#commandHandler });

        this.logger.trace({
            msg     : 'Ebot Command Handler is registered',
            event   : CoreEvents.COMMAND_HANDLER_REGISTERED,
            emitter : 'core'
        });
    }

    registerApplicationCommandHandler(settings) {

        this.#applicationCommandHandler = new ApplicationCommandHandler(this, Hoek.merge({}, settings));

        this.#coreListenerHandlers.get('applicationCommand').setEmitters({ handler : this.#applicationCommandHandler });

        this.logger.trace({
            msg     : 'Ebot Application Command Handler is registered',
            event   : CoreEvents.APPLICATION_COMMAND_HANDLER_REGISTERED,
            emitter : 'core'
        });
    }

    registerListenerHandler(settings) {

        this.#listenerHandler = new ListenerHandler(this, Hoek.merge({}, settings));

        this.logger.trace({ msg : 'Ebot Listener Handler is registered', event : CoreEvents.LISTENER_HANDLER_REGISTERED, emitter : 'core' });
    }

    registerInhibitorHandler(settings) {

        this.#inhibitorHandler = new InhibitorHandler(this, Hoek.merge({}, settings));

        this.logger.trace({ msg : 'Ebot Inhibitor Handler is registered', event : CoreEvents.INHIBITOR_HANDLER_REGISTERED, emitter : 'core' });
    }

    async registerModules(modulesPath) {

        if (!this.#initialized) {

            await this.initialize();
        }

        await this.registerModule('core', Path.join(__dirname, 'module'), this.#settings.core.module);

        for (const name of await Fs.readdir(modulesPath)) {

            await this.registerModule(name, Path.join(modulesPath, name), this.#settings.modules[name]);
        }
    }

    /**
     * @private
     * @param name
     * @param path
     * @param settings
     * @returns {Promise<void>}
     */
    async registerModule(name, path, settings) {

        if (this.#modules.has(name)) {

            throw new Error('A module with this name already exists');
        }

        const module = new Module(name, path);

        await module.load(this, settings);

        this.#modules.set(name, { path, module });

        this.logger.info({ msg : `Module ${ name } loaded from ${ path }`, emitter : 'core', event : CoreEvents.MODULE_LOADED });
    }

    async initialize() {

        await this.#setupCoreListenerHandlers();

        this.registerCommandHandler();
        this.registerApplicationCommandHandler();
        this.registerListenerHandler();
        this.registerInhibitorHandler();

        for (const module of this.#coreListenerHandlers.values()) {

            module.loadAll();
        }

        this.#initialized = true;

        this.logger.debug({ msg : 'Ebot core is initialized', event : 'initialized', emitter : 'core' });

        return this;
    }

    async start() {

        if (!this.#initialized) {

            await this.initialize();
        }

        for (const [, { module }] of this.#modules.entries()) {

            await module.init();
        }

        if (this.#listenerHandler) {

            this.#listenerHandler.setEmitters({
                commandHandler   : this.#commandHandler,
                inhibitorHandler : this.#inhibitorHandler,
                listenerHandler  : this.#listenerHandler
            });

            this.logger.trace({
                msg     : 'Ebot Command Handler is loaded',
                event   : CoreEvents.COMMAND_HANDLER_LOADED,
                emitter : 'core'
            });
        }

        if (this.#inhibitorHandler) {

            this.logger.trace({
                msg     : 'Ebot Inhibitor Handler is loaded',
                event   : CoreEvents.INHIBITOR_HANDLER_LOADED,
                emitter : 'core'
            });
        }

        if (this.#commandHandler) {

            if (this.#inhibitorHandler) {

                this.#commandHandler.useInhibitorHandler(this.#inhibitorHandler);
            }

            if (this.#listenerHandler) {

                this.#commandHandler.useListenerHandler(this.#listenerHandler);
            }

            this.logger.trace({
                msg     : 'Ebot Listener Handler is loaded',
                event   : CoreEvents.LISTENER_HANDLER_LOADED,
                emitter : 'core'
            });
        }

        if (this.#applicationCommandHandler) {

            this.logger.trace({
                msg     : 'Ebot Application Command Handler is loaded',
                event   : CoreEvents.APPLICATION_COMMAND_HANDLER_LOADED,
                emitter : 'core'
            });
        }

        await this.login(this.#settings.core.discord.token);

        await this.warmupCache();

        await this.#applicationCommandHandler.registerCommands();

        this.#started = true;

        this.rest.on('response', ({ method, route }, { statusCode }) => {

            this.logger.trace({
                msg     : `${ method } ${ route } (${ statusCode }`,
                event   : 'apiResponse',
                emitter : 'client'
            });
        });

        return this;
    }

    get logger() {

        return this.#logger;
    }

    get sentry() {

        if (this.#settings.core.sentry.enabled) {

            return this.#sentry;
        }

        return false;
    }

    providers(moduleName) {

        if (this.#modules.has(moduleName)) {

            return this.#modules.get(moduleName).module.providers();
        }

        throw new Error(`module ${ moduleName } not found`);
    }

    services(moduleName) {

        if (this.#modules.has(moduleName)) {

            return this.#modules.get(moduleName).module.services();
        }

        throw new Error(`module ${ moduleName } not found`);
    }

    views(moduleName) {

        if (this.#modules.has(moduleName)) {

            return this.#modules.get(moduleName).module.views();
        }

        throw new Error(`module ${ moduleName } not found`);
    }

    /**
     * @param moduleName
     * @return {Module~Store}
     */
    store(moduleName) {

        if (this.#modules.has(moduleName)) {

            return this.#modules.get(moduleName).module.store;
        }

        throw new Error(`module ${ moduleName } not found`);
    }

    get commandHandler() {

        return this.#commandHandler;
    }

    get applicationCommandHandler() {

        return this.#applicationCommandHandler;
    }

    get listenerHandler() {

        return this.#listenerHandler;
    }

    get inhibitorHandler() {

        return this.#inhibitorHandler;
    }

    async warmupCache() {

        this.logger.info({
            msg     : 'Starting warming up guilds/users cache',
            event   : CoreEvents.CACHE_WARMUP_STARTED,
            emitter : 'core'
        });

        for (const id of this.#settings.core.cacheWarmup.guilds) {

            const guild = await this.guilds.fetch(id);

            await guild.members.fetch();
        }

        for (const id of this.#settings.core.cacheWarmup.users) {

            await this.users.fetch(id);
        }

        this.logger.info({
            msg     : 'Done warming up guilds/users cache',
            event   : CoreEvents.CACHE_WARMUP_FINISHED,
            emitter : 'core'
        });
    }

    logInvite() {

        const url = this.generateInvite({
            scopes      : [
                OAuth2Scopes.Bot,
                OAuth2Scopes.ApplicationsCommands
            ],
            permissions : [
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
                PermissionsBitField.Flags.AddReactions,
                PermissionsBitField.Flags.ViewChannel
            ]
        });

        this.logger.info({
            msg     : `You can add the bot to your service with this link : ${ url }`,
            event   : CoreEvents.INVITE_LINK,
            emitter : 'core'
        });
    }

    /**
     * @param {AkairoModule} module
     * @param {Error}        error
     * @param {String}       [message]
     * @param {Object}       [extraData]
     */
    handleError(module, error, message, extraData = {}) {

        this.logger.error({
            event        : CoreEvents.MODULE_ERROR,
            emitter      : module.id,
            errorMessage : error?.toString(),
            err          : error,
            msg          : message
        });

        if (this.sentry) {

            this.sentry.configureScope((scope) => {

                scope.setContext('module', {
                    categoryID : module.categoryID,
                    id         : module.id
                });
            });

            this.sentry.captureException(error);
        }
    }

    get clientId() {

        return this.#settings.core.discord.clientId;
    }
};
