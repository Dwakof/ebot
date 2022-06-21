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

        this.client.logger.warn({
            msg     : `Bot is rate limited on request ${ data?.method?.toString() } ${ data?.route } for another ${ data.timeout } ms`,
            event   : this.event,
            emitter : this.emitter,
            data
        });
    }
};
