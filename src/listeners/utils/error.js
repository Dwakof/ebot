'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class ErrorListener extends Listener {

    constructor() {

        super('error', { emitter : 'commandHandler', event : 'error' });
    }

    exec(error, message, command) {

        console.error(`Error happened on the command: ${ command.id }\n${ error }\nOn the message: ${ message }`);

        this.client.handleError(this, error, message, { command });
    }
};
