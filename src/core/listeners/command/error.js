'use strict';

const { Listener } = require('discord-akairo');

module.exports = class ErrorListener extends Listener {

    constructor() {

        super('error', { category : 'core', emitter : 'commandHandler', event : 'error' });
    }

    exec(error, message, command) {

        this.client.handleError(this, error, message, { command });
    }
};
