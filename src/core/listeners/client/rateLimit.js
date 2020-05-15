'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class clientRateLimitListener extends Listener {

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
