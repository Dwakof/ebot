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
};
