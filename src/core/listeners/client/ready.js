'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ClientReadyListener extends Listener {

    constructor() {

        super(Events.ClientReady, { category : 'core', emitter : 'client' });
    }

    exec(none) {

        this.client.logger.info({ event : this.event, emitter : this.emitter, msg : 'Bot is ready' });

        this.client.logInvite();
    }
};
