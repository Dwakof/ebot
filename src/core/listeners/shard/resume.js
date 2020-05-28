'use strict';

const { Listener } = require('discord-akairo');
const { Constants } = require('discord.js');

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
            message : 'Shard resumed',
            shardId
        });
    }
};
