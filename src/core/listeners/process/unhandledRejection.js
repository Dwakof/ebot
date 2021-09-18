'use strict';

const { Listener } = require('../../');

module.exports = class processUnhandledRejectionListener extends Listener {

    constructor() {

        super('unhandledRejection', {
            category : 'core',
            emitter  : 'process',
            event    : 'unhandledRejection'
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
