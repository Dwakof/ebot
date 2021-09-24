'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class shardDisconnectListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_DISCONNECT, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_DISCONNECT
        });
    }

    exec(wsEvent, shardId) {

        this.client.logger.warn({
            event   : this.event,
            emitter : this.emitter,
            msg : 'Shard was disconnected',
            shardId, wsEvent
        });
    }
};
