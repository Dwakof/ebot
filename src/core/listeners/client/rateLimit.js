'use strict';

const { Listener } = require('../../');

module.exports = class ClientRateLimitListener extends Listener {

    constructor() {

        super('rateLimit', { category : 'core', emitter : 'client' });
    }

    exec(data) {

        this.client.logger.warn({
            msg     : `Bot is rate limited on request ${ data?.method?.toString() } ${ data?.route } for another ${ data.timeout } ms`,
            event   : this.event,
            emitter : this.emitter,
            data
        });
    }
};
