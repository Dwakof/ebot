'use strict';

const { CommandHandler, InhibitorHandler, ListenerHandler } = require('discord-akairo');

const { CoreEvents } = require('./constants')

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
    async load(client) {

        this.#client = client;

        if (this.beforeLoad) {

            await this.beforeLoad(this.#client);
        }

        const emitters = {};

        if (this.commandHandler) {

            this.#commandHandler = new CommandHandler(this.#client, {
                ...this.commandHandler,
                category : this.#id
            });

            emitters.commandHandler = this.#commandHandler;

            this.#client.logger.trace({ event : CoreEvents.COMMAND_HANDLER_REGISTERED, emitter : 'core', plugin : this.id });
        }

        if (this.inhibitorHandler) {

            this.#inhibitorHandler = new InhibitorHandler(this.#client, {
                ...this.inhibitorHandler,
                category : this.#id
            });

            emitters.inhibitorHandler = this.#inhibitorHandler;

            if (this.#commandHandler) {

                this.#commandHandler.useInhibitorHandler(this.#inhibitorHandler);
            }

            this.#client.logger.trace({ event : CoreEvents.INHIBITOR_HANDLER_REGISTERED, emitter : 'core', plugin : this.id });
        }

        if (this.listenerHandler) {

            this.#listenerHandler = new ListenerHandler(this.#client, {
                ...this.listenerHandler,
                category : this.#id
            });

            emitters.listenerHandler = this.#listenerHandler;

            this.#listenerHandler.setEmitters(emitters);

            if (this.#commandHandler) {

                this.#commandHandler.useListenerHandler(this.#listenerHandler);
            }

            this.#client.logger.trace({ event : CoreEvents.LISTENER_HANDLER_REGISTERED, emitter : 'core', plugin : this.id });
        }

        if (this.#commandHandler) {

            this.#commandHandler.loadAll();

            this.#client.logger.trace({ event : CoreEvents.COMMAND_HANDLER_LOADED, emitter : 'core', plugin : this.id });
        }

        if (this.#inhibitorHandler) {

            this.#inhibitorHandler.loadAll();

            this.#client.logger.trace({ event : CoreEvents.INHIBITOR_HANDLER_LOADED, emitter : 'core', plugin : this.id });
        }

        if (this.#listenerHandler) {

            this.#listenerHandler.loadAll();

            this.#client.logger.trace({ event : CoreEvents.LISTENER_HANDLER_LOADED, emitter : 'core', plugin : this.id });
        }

        if (this.afterLoad) {

            await this.afterLoad(this.#client);
        }
    }

    get id() {

        return this.#id;
    }

    get client() {

        return this.#client;
    }
}
