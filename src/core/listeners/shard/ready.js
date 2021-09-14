'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class shardReadyListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_READY, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_READY
        });
    }

    exec(shardId) {

        this.client.logger.debug({
            event   : this.event,
            emitter : this.emitter,
            message : 'Shard is ready',
            shardId
        });
    }
};
