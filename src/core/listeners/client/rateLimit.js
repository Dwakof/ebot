'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ClientRateLimitListener extends Listener {

    constructor() {

        super(Constants.Events.RATE_LIMIT, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.RATE_LIMIT
        });
    }

    exec(data) {

        this.client.logger.warn({ event : this.event, emitter : this.emitter, data });
    }
};
