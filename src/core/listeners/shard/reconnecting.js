'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ShardReconnectingListener extends Listener {

    constructor() {

        super(Events.ShardReconnecting, { category : 'core', emitter : 'client' });
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
