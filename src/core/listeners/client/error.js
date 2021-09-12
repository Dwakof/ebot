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

    exec(error) {

        this.client.logger.error({ event : this.event, emitter : this.emitter, error, message : error.toString() });

        if (this.client.sentry) {

            this.client.sentry.captureException(error);
        }
    }
};
