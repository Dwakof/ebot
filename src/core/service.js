'use strict';

class Service {

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
