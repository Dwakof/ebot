'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ClientDebugListener extends Listener {

    constructor() {

        super(Events.Debug, { category : 'core', emitter : 'client' });
    }

    exec(msg) {

        this.client.logger.trace({ event : this.event, emitter : this.emitter, msg });
    }
};
