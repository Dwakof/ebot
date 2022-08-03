'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ClientErrorListener extends Listener {

    constructor() {

        super(Events.Error, { category : 'core', emitter : 'client' });
    }

    exec(err) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, err, msg : err.toString() });

        if (this.client.sentry) {

            this.client.sentry.captureException(err);
        }
    }
};
