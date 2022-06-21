'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class ShardDisconnectListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_DISCONNECT, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_DISCONNECT
        });
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
