'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ShardReconnectingListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_RECONNECTING, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_RECONNECTING
        });
    }

    exec(shardId) {

        this.client.logger.info({
            msg     : 'Shard is reconnecting',
            event   : this.event,
            emitter : this.emitter,
            shardId
        });
    }
};
