'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class GuildUnavailableListener extends Listener {

    constructor() {

        super(Constants.Events.GUILD_UNAVAILABLE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.GUILD_UNAVAILABLE
        });
    }

    exec(guild) {

        this.client.logger.debug({
            event   : this.event,
            emitter : this.emitter,
            message : {
                id   : guild?.id,
                name : guild?.name
            }
        });
    }
};
