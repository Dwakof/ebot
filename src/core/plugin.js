'use strict';

const { CommandHandler, InhibitorHandler, ListenerHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants');

module.exports = class Plugin {

    #client;
    #id;

    #commandHandler;
    #inhibitorHandler;
    #listenerHandler;

    constructor() {

        this.#id = this.id;
    }

    /**
     * @param {EbotClient} client
     */
    async register(client) {

        this.#client = client;

        if (this.providers) {

            let providers = this.providers;

            if (typeof this.providers === 'function') {

                providers = await this.providers(client);
            }

            if (!Array.isArray(providers)) {

                providers = [providers];
            }

            for (const data of providers) {

                if (data) {

                    await this.client.registerProvider(data.id, data.provider);
                }
            }
        }
    }

    /**
     * @param {EbotClient} client
     */
    async load(client) {


        if (this.beforeLoad) {

            await this.beforeLoad(this.#client);

            this.#client.logger.trace({ event : CoreEvents.PLUGIN_BEFORE_LOAD, emitter : 'core', plugin : this.id });
        }

        const emitters = {};

        if (this.commandHandler) {

            let commandHandler = this.commandHandler;

            if (typeof this.commandHandler === 'function') {

                commandHandler = this.commandHandler(client);
            }

            this.#commandHandler = new CommandHandler(this.#client, { ...commandHandler, category : this.#id });

            emitters.commandHandler = this.#commandHandler;

            this.#client.logger.trace({
                event   : CoreEvents.COMMAND_HANDLER_REGISTERED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.inhibitorHandler) {

            let inhibitorHandler = this.inhibitorHandler;

            if (typeof this.inhibitorHandler === 'function') {

                inhibitorHandler = this.inhibitorHandler(client);
            }

            this.#inhibitorHandler = new InhibitorHandler(this.#client, { ...inhibitorHandler, category : this.#id });

            emitters.inhibitorHandler = this.#inhibitorHandler;

            if (this.#commandHandler) {

                this.#commandHandler.useInhibitorHandler(this.#inhibitorHandler);
            }

            this.#client.logger.trace({
                event   : CoreEvents.INHIBITOR_HANDLER_REGISTERED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.listenerHandler) {

            let listenerHandler = this.listenerHandler;

            if (typeof this.listenerHandler === 'function') {

                listenerHandler = this.listenerHandler(client);
            }

            this.#listenerHandler = new ListenerHandler(this.#client, { ...listenerHandler, category : this.#id });

            emitters.listenerHandler = this.#listenerHandler;

            this.#listenerHandler.setEmitters(emitters);

            if (this.#commandHandler) {

                this.#commandHandler.useListenerHandler(this.#listenerHandler);
            }

            this.#client.logger.trace({
                event   : CoreEvents.LISTENER_HANDLER_REGISTERED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.#commandHandler) {

            this.#commandHandler.loadAll();

            this.#client.logger.trace({
                event   : CoreEvents.COMMAND_HANDLER_LOADED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.#inhibitorHandler) {

            this.#inhibitorHandler.loadAll();

            this.#client.logger.trace({
                event   : CoreEvents.INHIBITOR_HANDLER_LOADED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.#listenerHandler) {

            this.#listenerHandler.loadAll();

            this.#client.logger.trace({
                event   : CoreEvents.LISTENER_HANDLER_LOADED,
                emitter : 'core',
                plugin  : this.id
            });
        }

        if (this.afterLoad) {

            await this.afterLoad(this.#client);

            this.#client.logger.trace({ event : CoreEvents.PLUGIN_AFTER_LOAD, emitter : 'core', plugin : this.id });
        }
    }

    get id() {

        return this.#id;
    }

    get client() {

        return this.#client;
    }

    providers() { return false; }

    commandHandler() { return false; }

    inhibitorHandler() { return false; }

    listenerHandler() { return false; }
};
