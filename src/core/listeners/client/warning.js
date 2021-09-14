'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class clientWarningListener extends Listener {

    constructor() {

        super(Constants.Events.WARN, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.WARN
        });
    }

    exec(message) {

        this.client.logger.warn({ event : this.event, emitter : this.emitter, message });
    }
};
