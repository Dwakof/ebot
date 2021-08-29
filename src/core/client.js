'use strict';

const Sentry = require("@sentry/node");
const Tracing = require("@sentry/tracing");


const Path   = require('path');
const Pino   = require('pino');
const Hoek   = require('@hapi/hoek');
const Fs     = require('fs/promises');

const { Permissions } = require('discord.js');

const { AkairoClient, AkairoModule, ListenerHandler, InhibitorHandler } = require('discord-akairo');

const CommandHandler = require('./CommandHandler');

const { CoreEvents } = require('./constants');

const Module = require('./module');

const Utils = require('./utils');

module.exports = class EbotClient extends AkairoClient {

    #settings;

    #initialized = false;
    #started     = false;

    #logger;
    #sentry;

    #coreListenerHandlers = new Map();

    #providers = new Map();

    #commandHandler;
    #inhibitorHandler;
    #listenerHandler;

    #modules = new Map();

    constructor(settings) {

        super({ ownerId : settings.discord.ownerId }, settings.discord);

        this.#settings = settings;

        this.#logger = Pino(this.#settings.logger);

        if (this.#settings.sentry.enabled) {

            Sentry.init({
                ...this.#settings.sentry,
                integrations : [
                    new Sentry.Integrations.Http({ tracing: true }),
                    new Tracing.Integrations.Postgres(),
                ]
            });

            this.#sentry = Sentry;

            this.logger.debug({ event : CoreEvents.SENTRY_INITIALIZED, emitter : 'core' });
        }
    }

    #setupCoreListenerHandlers = () => {

        this.#coreListenerHandlers.set('process', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/process/') }));

        this.#coreListenerHandlers.get('process').setEmitters({ process });

        this.#coreListenerHandlers.set('client', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/client/') }));

        this.#coreListenerHandlers.set('shard', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/shard/') }));

        this.#coreListenerHandlers.set('message', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/message/') }));

        this.#coreListenerHandlers.set('guild', new ListenerHandler(this, { directory : Path.join(__dirname, './listeners/guild/') }));

        for (const module of this.#coreListenerHandlers.values()) {

            module.loadAll();
        }
    };

    /**
     * @param {Function|Object} input
     */
    async registerProvider(input) {

        let id;
        let provider;

        if (typeof input === 'function') {

            ({ id, provider } = await input(this));
        }
        else {

            ({ id, provider } = input);
        }

        if (this.#providers.has(id)) {

            throw new Error('A provider under the same ID was already registered');
        }

        this.#providers.set(id, provider);

        this.logger.trace({ event : CoreEvents.PROVIDER_REGISTERED, emitter : 'core', id });

        if (this.#started) {

            await provider.init();

            this.logger.debug({ event : CoreEvents.PROVIDER_INITIALIZED, emitter : 'core', id });
        }

        return provider;
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

        this.#setupCoreListenerHandlers();
        this.registerCommandHandler();
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

        for (const [id, provider] of this.#providers.entries()) {

            await provider.init();

            this.logger.debug({ event : CoreEvents.PROVIDER_INITIALIZED, emitter : 'core', id });
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

        await this.login(this.#settings.discord.token);

        await this.warmupCache();

        this.#started = true;

        await this.logInvite();

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

    get providers() {

        return Array.from(this.#providers.entries()).reduce((acc, [k, v]) => ({ ...acc, [k] : v }), {});
    }

    get commandHandler() {

        return this.#commandHandler;
    }

    get listenerHandler() {

        return this.#listenerHandler;
    }

    get inhibitorHandler() {

        return this.#inhibitorHandler;
    }

    get utils() {

        return Utils;
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

    async logInvite() {

        this.logger.info({
            event   : CoreEvents.INVITE_LINK,
            emitter : 'core',
            url     : await this.generateInvite({
                scopes      : ['bot'],
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
     * @param {String}       message
     * @param {Object}       extraData
     */
    handleError(module, error, message, extraData = {}) {

        this.logger.error({
            event        : CoreEvents.MODULE_ERROR,
            emitter      : module.id,
            error,
            errorMessage : error.toString(),
            message
        });

        if (this.sentry) {

            this.sentry.captureException(error);
        }
    }
};
