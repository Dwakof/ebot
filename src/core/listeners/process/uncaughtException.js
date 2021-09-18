'use strict';

const { Listener } = require('../../');

module.exports = class processUncaughtExceptionListener extends Listener {

    constructor() {

        super('uncaughtException', {
            category : 'core',
            emitter  : 'process',
            event    : 'uncaughtException'
        });
    }

    exec(error) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, error, message : error.toString() });

        if (this.client.sentry) {

            this.client.sentry.captureException(error);
        }

        throw error;
    }
};
