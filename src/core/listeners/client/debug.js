'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class clientDebugListener extends Listener {

    constructor() {

        super(Constants.Events.DEBUG, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.DEBUG
        });
    }

    exec(message) {

        this.client.logger.trace({ event : this.event, emitter : this.emitter, message });
    }
};
