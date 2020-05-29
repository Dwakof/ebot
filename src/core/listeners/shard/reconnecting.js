'use strict';

const { Listener } = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class shardReconnectingListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_RECONNECTING, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_RECONNECTING
        });
    }

    exec(shardId) {

        this.client.logger.info({
            event   : this.event,
            emitter : this.emitter,
            message : 'Shard is reconnecting',
            shardId
        });
    }
};
