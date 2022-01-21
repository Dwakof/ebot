'use strict';

const { Listener : AkairoListener } = require('discord-akairo');

/**
 * Represents a listener.
 *
 * @param {string} id - Listener ID.
 * @param {ListenerOptions} [options={}] - Options for the listener.
 *
 * @extends {AkairoModule}
 */
module.exports = class Listener extends AkairoListener {

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
