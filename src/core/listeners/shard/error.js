'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ShardErrorListener extends Listener {

    constructor() {

        super(Events.ShardError, { category : 'core', emitter : 'client' });
    }

    exec(error, shardId) {

        this.client.logger.error({
            msg      : `Shard ${ shardId } errored`,
            event    : this.event,
            emitter  : this.emitter,
            metadata : { shardId },
            err      : error
        });

        if (this.client.sentry) {

            this.client.sentry.captureException(error);
        }
    }
};
