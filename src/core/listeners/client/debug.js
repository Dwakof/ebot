'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ClientDebugListener extends Listener {

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
