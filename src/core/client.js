'use strict';

const Path   = require('path');
const Pino   = require('pino');
const Sentry = require('@sentry/node');

const { AkairoClient, ListenerHandler, Provider, AkairoModule } = require('discord-akairo');

const { CoreEvents } = require('./constants');

module.exports = class EbotClient extends AkairoClient {

    #settings;

    #initialized = false;
    #started     = false;

    #logger;
    #sentry;

    #coreListenerHandlers = new Map();

    #plugins = new Map();

    #providers = new Map();

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
     * @param {Plugin} plugin
     */
    async registerPlugin(plugin) {

        if (this.#plugins.has(plugin.id)) {

            throw new Error('A plugin under the same ID was already registered');
        }

        this.#plugins.set(plugin.id, plugin);

        await plugin.register(this);

        this.logger.trace({ event : CoreEvents.PLUGIN_REGISTERED, emitter : 'core', id : plugin.id });

        if (this.#started) {

            await plugin.load(this);

            this.logger.debug({ event : CoreEvents.PLUGIN_LOADED, emitter : 'core', id : plugin.id });
        }
    }

    /**
     * @param {string}   id
     * @param {Provider} provider
     */
    async registerProvider(id, provider) {

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

        for (const plugin of this.#plugins.values()) {

            await plugin.load(this);

            this.logger.debug({ event : CoreEvents.PLUGIN_LOADED, emitter : 'core', id : plugin.id });
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
