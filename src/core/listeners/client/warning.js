'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ClientWarningListener extends Listener {

    constructor() {

        super(Events.Warn, { category : 'core', emitter : 'client' });
    }

    exec(msg) {

        this.client.logger.warn({ event : this.event, emitter : this.emitter, msg });
    }
};
