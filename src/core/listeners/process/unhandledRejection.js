'use strict';

const { Listener } = require('../../');

module.exports = class ProcessUnhandledRejectionListener extends Listener {

    constructor() {

        super('unhandledRejection', { category : 'core', emitter : 'process' });
    }

    exec(err) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, err, msg : err.toString() });

        this.client.sentry.captureException(err);

        throw err;
    }
};
