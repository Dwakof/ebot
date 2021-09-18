'use strict';

const Sentry  = require('@sentry/node');
const Tracing = require('@sentry/tracing');

const Path = require('path');
const Pino = require('pino');
const Hoek = require('@hapi/hoek');
const Fs   = require('fs/promises');

const { Permissions, Intents } = require('discord.js');
const { REST }                 = require('@discordjs/rest');

const { AkairoClient, InhibitorHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants');

const CommandHandler      = require('./struct/command/commandHandler');
const SlashCommandHandler = require('./struct/slashCommand/slashCommandHandler');
const ListenerHandler     = require('./struct/listener/listenerHandler');
const Module              = require('./struct/module');

const ClientUtil = require('./clientUtil');

module.exports = class EbotClient extends AkairoClient {

    #settings;

    #initialized = false;
    #started     = false;

    #logger;
    #sentry;

    #coreListenerHandlers = new Map();

    #commandHandler;
    #slashCommandHandler;
    #inhibitorHandler;
    #listenerHandler;

    #modules = new Map();

    constructor(settings) {

        super({ ownerID : settings.discord.ownerID }, {
            ...settings.discord,
            intents : [
                Intents.FLAGS.GUILDS,
                Intents.FLAGS.GUILD_MEMBERS,
                Intents.FLAGS.GUILD_MESSAGES,
                Intents.FLAGS.GUILD_MESSAGE_REACTIONS
            ]
        });

        this.#settings = settings;

        this.util = new ClientUtil(this);
        this.API  = new REST({ version : '9' }).setToken(this.#settings.discord.token);

        this.#logger = Pino(this.#settings.logger);

        if (this.#settings.sentry.enabled) {

            Sentry.init({
                ...this.#settings.sentry,
                integrations : [
                    new Sentry.Integrations.Http({ tracing : true }),
                    new Tracing.Integrations.Postgres()
                ]
            });

            this.#sentry = Sentry;

            this.logger.debug({ event : CoreEvents.SENTRY_INITIALIZED, emitter : 'core' });
        }
    }

    async #setupCoreListenerHandlers() {

        const rootPath = Path.join(__dirname, 'listeners');

        for (const handler of await Fs.readdir(rootPath)) {

            this.#coreListenerHandlers.set(handler, new ListenerHandler(this, { directory : Path.join(rootPath, handler) }));
        }

        this.#coreListenerHandlers.get('process').setEmitters({ process });

        for (const module of this.#coreListenerHandlers.values()) {

            module.loadAll();
        }
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
            ignorePermissions   : this.#settings.discord.ownerId,
            ignoreCooldown      : this.#settings.discord.ownerId,
            prefix              : this.#settings.discord.prefix

        }, settings));

        this.logger.trace({ event : CoreEvents.COMMAND_HANDLER_REGISTERED, emitter : 'core' });
    }

    registerSlashCommandHandler(settings) {

        this.#slashCommandHandler = new SlashCommandHandler(this, Hoek.merge({}, settings));

        this.logger.trace({ event : CoreEvents.SLASH_COMMAND_HANDLER_REGISTERED, emitter : 'core' });
    }

    registerListenerHandler(settings) {

        this.#listenerHandler = new ListenerHandler(this, Hoek.merge({}, settings));

        this.logger.trace({ event : CoreEvents.LISTENER_HANDLER_REGISTERED, emitter : 'core' });
    }

    registerInhibitorHandler(settings) {

        this.#inhibitorHandler = new InhibitorHandler(this, Hoek.merge({}, settings));

        this.logger.trace({ event : CoreEvents.INHIBITOR_HANDLER_REGISTERED, emitter : 'core' });
    }

    async registerModules(modulesPath) {

        if (!this.#initialized) {

            await this.initialize();
        }

        for (const name of await Fs.readdir(modulesPath)) {

            if (this.#modules.has(name)) {

                throw new Error('A module with this name already exists');
            }

            const path = Path.join(modulesPath, name);

            const module = new Module(name, path);

            await module.load(this);

            this.#modules.set(name, { path, module });

            this.logger.debug({
                event   : CoreEvents.MODULE_LOADED,
                emitter : 'core',
                message : `Module ${ name } loaded from ${ path }`
            });
        }
    }

    async initialize() {

        await this.#setupCoreListenerHandlers();

        this.registerCommandHandler();
        this.registerSlashCommandHandler();
        this.registerListenerHandler();
        this.registerInhibitorHandler();

        this.#initialized = true;

        this.logger.debug({ event : 'initialized', emitter : 'core' });

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

            this.logger.trace({ event : CoreEvents.COMMAND_HANDLER_LOADED, emitter : 'core' });
        }

        if (this.#inhibitorHandler) {

            this.logger.trace({ event : CoreEvents.INHIBITOR_HANDLER_LOADED, emitter : 'core' });
        }

        if (this.#commandHandler) {

            if (this.#inhibitorHandler) {

                this.#commandHandler.useInhibitorHandler(this.#inhibitorHandler);
            }

            if (this.#listenerHandler) {

                this.#commandHandler.useListenerHandler(this.#listenerHandler);
            }

            this.#coreListenerHandlers.set('command', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/command/') }));

            this.#coreListenerHandlers.get('command').setEmitters({ commandHandler : this.#commandHandler });

            this.logger.trace({ event : CoreEvents.LISTENER_HANDLER_LOADED, emitter : 'core' });
        }

        if (this.#slashCommandHandler) {

            this.logger.trace({ event : CoreEvents.SLASH_COMMAND_HANDLER_LOADED, emitter : 'core' });
        }

        await this.login(this.#settings.discord.token);

        await this.warmupCache();

        await this.#slashCommandHandler.registerCommands();

        this.#started = true;

        this.logInvite();

        return this;
    }

    get logger() {

        return this.#logger;
    }

    get sentry() {

        if (this.#settings.sentry.enabled) {

            return this.#sentry;
        }

        return false;
    }

    get settings() {

        return this.#settings;
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

    get commandHandler() {

        return this.#commandHandler;
    }

    get slashCommandHandler() {

        return this.#slashCommandHandler;
    }

    get listenerHandler() {

        return this.#listenerHandler;
    }

    get inhibitorHandler() {

        return this.#inhibitorHandler;
    }

    async warmupCache() {

        this.logger.info({ event : CoreEvents.CACHE_WARMUP_STARTED, emitter : 'core' });

        for (const id of this.#settings.ebot.cacheWarmup.guilds) {

            const guild = await this.guilds.fetch(id);

            await guild.members.fetch();
        }

        for (const id of this.#settings.ebot.cacheWarmup.users) {

            await this.users.fetch(id);
        }

        this.logger.info({ event : CoreEvents.CACHE_WARMUP_FINISHED, emitter : 'core' });
    }

    logInvite() {

        this.logger.info({
            event   : CoreEvents.INVITE_LINK,
            emitter : 'core',
            url     : this.generateInvite({
                scopes      : ['bot', 'applications.commands'],
                permissions : [
                    Permissions.FLAGS.SEND_MESSAGES,
                    Permissions.FLAGS.READ_MESSAGE_HISTORY,
                    Permissions.FLAGS.ADD_REACTIONS,
                    Permissions.FLAGS.VIEW_CHANNEL
                ]
            })
        });
    }

    /**
     * @param {AkairoModule} module
     * @param {Error}        error
     * @param {String}       [message]
     * @param {Object}       [extraData]
     */
    handleError(module, error, message, extraData = {}) {

        console.error(error);

        this.logger.error({
            event        : CoreEvents.MODULE_ERROR,
            emitter      : module.id,
            errorMessage : error.toString(),
            error,
            message
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
};
