'use strict';

class Service {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     * @param {String}     module
     */
    constructor(client, module) {

        this.client = client;
        this.module = module;
        this.id     = new.target.name;
    }

    /**
     * Method to override that is called when the client is started.
     */
    init() {

    }

    services(module = this.module) {

        return this.client.services(module);
    }

    views(module = this.module) {

        return this.client.views(module);
    }

    providers(module = this.module) {

        return this.client.providers(module);
    }
}

module.exports = Service;
