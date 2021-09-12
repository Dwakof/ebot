'use strict';

const { ListenerHandler : AkairoListenerHandler } = require('discord-akairo');

const CoreUtil = require('./util');


/**
 * Loads listeners and registers them with EventEmitters.
 *
 * @param {EbotClient} client - The Ebot client.
 * @param {AkairoHandlerOptions} options - Options.
 *
 * @extends {AkairoListenerHandler}
 */
module.exports = class ListenerHandler extends AkairoListenerHandler {

    /**
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     * @param {AkairoHandlerOptions} options
     */
    constructor(client, options) {

        super(client, options);

        this.client = client;
    }

    register(listener, filepath) {

        const exec = listener.exec;

        listener.exec = (...args) => {

            try {

                if (this.client.sentry) {

                    this.client.sentry.configureScope((scope) => {

                        if (Object.keys(args).length > 0) {

                            scope.setContext('args', CoreUtil.serializeArgs(args));
                        }
                    });
                }

                exec.bind(listener)(...args);
            }
            catch (error) {

                this.client.handleError(listener, error);
            }
        };

        super.register(listener, filepath);
    }
};
