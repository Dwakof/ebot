'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class shardErrorListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_ERROR, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_ERROR
        });
    }

    exec(error, shardId) {

        this.client.logger.error({
            event   : this.event,
            emitter : this.emitter,
            message : 'Shard errored',
            shardId, error
        });

        if (this.client.sentry) {

            this.client.sentry.captureException(error);
        }
    }
};
