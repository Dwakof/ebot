'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class GuildUnavailableListener extends Listener {

    constructor() {

        super(Events.GuildUnavailable, { category : 'core', emitter : 'client' });
    }

    exec(guild) {

        this.client.logger.debug({
            msg     : `Guild "${ guild?.name }" (${ guild?.id }) is now unavailable`,
            event   : this.event,
            emitter : this.emitter,
            message : {
                id   : guild?.id,
                name : guild?.name
            }
        });
    }
};
