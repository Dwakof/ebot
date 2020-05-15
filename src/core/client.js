'use strict';

const Path   = require('path');
const Pino   = require('pino');
const Sentry = require('@sentry/node');

const { AkairoClient, ListenerHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants');

module.exports = class EbotClient extends AkairoClient {

    #settings;

    #initialized = false;
    #started     = false;

    #logger;
    #sentry;

    #coreListenerHandlers = new Map();

    #plugins = new Map();

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

    #setupPlugins = async () => {

        for (const plugin of this.#plugins.values()) {

            await plugin.load(this);

            this.logger.debug({ event : CoreEvents.PLUGIN_LOADED, emitter : 'core', id : plugin.id });
        }
    };

    /**
     * @param {Plugin} plugin
     */
    register(plugin) {

        if (this.#plugins.has(plugin.id)) {

            throw new Error('A plugin under the same ID was already registered');
        }

        this.#plugins.set(plugin.id, plugin);

        this.logger.debug({ event : CoreEvents.PLUGIN_REGISTERED, emitter : 'core', id : plugin.id });
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

        await this.#setupPlugins();

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
};
