'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class shardResumeListener extends Listener {

    constructor() {

        super(Constants.Events.SHARD_RESUME, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.SHARD_RESUME
        });
    }

    exec(shardId) {

        this.client.logger.info({
            event   : this.event,
            emitter : this.emitter,
            msg : 'Shard resumed',
            shardId
        });
    }
};
