'use strict';

const { Command : AkairoCommand } = require('discord-akairo');

/**
 * Represents a command.
 *
 * @param {string} id - Command ID.
 * @param {CommandOptions} [options={}] - Options for the command.
 *
 * @extends {AkairoCommand}
 */
module.exports = class Command extends AkairoCommand {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    services(module = this.categoryID) {

        return this.client.services(module);
    }

    views(module = this.categoryID) {

        return this.client.views(module);
    }

    /**
     * @deprecated
     */
    providers(module = this.categoryID) {

        return this.client.providers(module);
    }
};
