'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ShardReadyListener extends Listener {

    constructor() {

        super(Events.ShardReady, { category : 'core', emitter : 'client' });
    }

    exec(shardId) {

        this.client.logger.debug({
            msg     : 'Shard is ready',
            event   : this.event,
            emitter : this.emitter,
            shardId
        });
    }
};
