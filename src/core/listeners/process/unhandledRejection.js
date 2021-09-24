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

    exec(err) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, err, msg : err.toString() });

        if (this.client.sentry) {

            this.client.sentry.captureException(err);
        }

        throw err;
    }
};
