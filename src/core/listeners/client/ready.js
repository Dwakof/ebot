'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ClientReadyListener extends Listener {

    constructor() {

        super(Constants.Events.CLIENT_READY, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.CLIENT_READY
        });
    }

    exec(none) {

        this.client.logger.info({ event : this.event, emitter : this.emitter, msg : 'Bot is ready' });
    }
};
