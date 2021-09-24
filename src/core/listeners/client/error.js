'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class clientErrorListener extends Listener {

    constructor() {

        super(Constants.Events.ERROR, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.ERROR
        });
    }

    exec(err) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, err, msg : err.toString() });

        if (this.client.sentry) {

            this.client.sentry.captureException(err);
        }
    }
};
