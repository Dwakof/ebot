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

    /**
     * Method to override that is called when the client is started.
     */
    init() {

    }
}

module.exports = Service;
