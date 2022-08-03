'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ShardDisconnectListener extends Listener {

    constructor() {

        super(Events.ShardDisconnect, { category : 'core', emitter : 'client' });
    }

    exec(wsEvent, shardId) {

        this.client.logger.warn({
            msg     : 'Shard was disconnected',
            event   : this.event,
            emitter : this.emitter,
            shardId, wsEvent
        });
    }
};
