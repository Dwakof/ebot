'use strict';

const Path   = require('path');
const Pino   = require('pino');
const Sentry = require('@sentry/node');
const Hoek   = require('@hapi/hoek');

const { AkairoClient, AkairoModule, CommandHandler, ListenerHandler, InhibitorHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants');

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

    constructor(settings) {

        super({ ownerId : settings.discord.ownerId }, settings.discord);

        this.#settings = settings;

        this.#logger = Pino(this.#settings.logger);

        if (this.#settings.sentry.enabled) {

            this.#sentry = Sentry.init(this.#settings.sentry);

            this.logger.trace({ event : CoreEvents.SENTRY_INITIALIZED, emitter : 'core' });
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

    async initialize() {

        this.#setupCoreListenerHandlers();

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

            this.#listenerHandler.loadAll();

            this.logger.trace({ event : CoreEvents.COMMAND_HANDLER_LOADED, emitter : 'core' });
        }

        if (this.#inhibitorHandler) {

            this.#inhibitorHandler.loadAll();

            this.logger.trace({ event : CoreEvents.INHIBITOR_HANDLER_LOADED, emitter : 'core' });
        }

        if (this.#commandHandler) {

            if (this.#inhibitorHandler) {

                this.#commandHandler.useInhibitorHandler(this.#inhibitorHandler);
            }

            if (this.#listenerHandler) {

                this.#commandHandler.useListenerHandler(this.#listenerHandler);
            }

            this.#commandHandler.loadAll();

            this.logger.trace({ event : CoreEvents.LISTENER_HANDLER_LOADED, emitter : 'core' });
        }

        await this.login(this.#settings.discord.token);

        this.#started = true;

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

    /**
     * @param {AkairoModule} module
     * @param {Error}        error
     * @param {String}       message
     * @param {Object}       extraData
     */
    handleError(module, error, message, extraData = {}) {

        this.#logger.error({
            event        : CoreEvents.MODULE_ERROR,
            emitter      : module.id,
            error,
            errorMessage : error.toString(),
            message
        });

        if (this.#sentry) {

            this.#sentry.captureException(error);
        }
    }
};
