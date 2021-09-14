'use strict';

class Service {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     */
    constructor(client) {

        this.client = client;
        this.id     = new.target.name;
    }

    init() {

    }
}

module.exports = Service;
