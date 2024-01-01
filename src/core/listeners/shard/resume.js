'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class ShardResumeListener extends Listener {

    constructor() {

        super(Events.ShardResume, { category : 'core', emitter : 'client' });
    }

    exec(shardId) {

        this.client.logger.info({
            msg      : `Shard ${ shardId } resumed`,
            event    : this.event,
            emitter  : this.emitter,
            metadata : { shardId }
        });
    }
};
