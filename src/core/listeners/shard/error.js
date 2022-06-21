'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ShardErrorListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_ERROR, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_ERROR
        });
    }

    exec(error, shardId) {

        this.client.logger.error({
            msg     : 'Shard errored',
            event   : this.event,
            emitter : this.emitter,
            err     : error,
            shardId
        });

        if (this.client.sentry) {

            this.client.sentry.captureException(error);
        }
    }
};
