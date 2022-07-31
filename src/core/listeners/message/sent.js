'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class SessageSentListener extends Listener {

    constructor() {

        super(Events.MessageCreate, { category : 'core', emitter : 'client' });
    }

    exec(message) {

        this.client.logger.debug({
            msg     : `User "${ message?.author?.username }" sent the message "${ message.id }" in channel "${ message?.channel?.name }" in guild "${ message?.guild?.name }"`,
            event   : this.event,
            emitter : this.emitter,
            message : {
                id          : message.id,
                channelType : message?.channel?.type,
                channelName : message?.channel?.name,
                channelId   : message?.channel?.id,
                authorId    : message?.author?.id,
                authorName  : message?.author?.username,
                guildId     : message?.guild?.id,
                guildName   : message?.guild?.name,
                content     : message?.content,
                embeds      : message?.embeds
            }
        });
    }
};
