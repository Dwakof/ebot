'use strict';

const { ListenerHandler : AkairoListenerHandler } = require('discord-akairo');

const CoreUtil = require('./util');

module.exports = class ListenerHandler extends AkairoListenerHandler {

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
