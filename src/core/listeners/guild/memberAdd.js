'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class memberAddListener extends Listener {

    constructor() {

        super(Constants.Events.GUILD_MEMBER_ADD, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.GUILD_MEMBER_ADD
        });
    }

    exec(member) {

        this.client.logger.debug({
            event   : this.event,
            emitter : this.emitter,
            message : {
                id        : member?.author?.id,
                name      : member?.author?.name,
                guildId   : member?.guild?.id,
                guildName : member?.guild?.name,
                joinedAt  : member?.joinedAt
            }
        });
    }
};