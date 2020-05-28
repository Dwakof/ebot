'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class clientReadyListener extends Listener {

    constructor() {

        super(Constants.Events.CLIENT_READY, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.CLIENT_READY
        });
    }

    exec(none) {

        this.client.logger.info({ event : this.event, emitter : this.emitter, message : 'Bot is ready' });
    }
};
