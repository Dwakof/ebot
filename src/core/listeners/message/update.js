'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class MessageUpdateListener extends Listener {

    constructor() {

        super(Events.MessageUpdate, { category : 'core', emitter : 'client' });
    }

    exec(oldMessage, newMessage) {

        this.client.logger.debug({
            msg        : `User "${ newMessage?.author?.username }" updated the message "${ newMessage.id }" in channel "${ newMessage?.channel?.name }" in guild "${ newMessage?.guild?.name }"`,
            event      : this.event,
            emitter    : this.emitter,
            oldMessage : {
                id          : oldMessage.id,
                channelType : oldMessage?.channel?.type,
                channelName : oldMessage?.channel?.name,
                authorId    : oldMessage?.author?.id,
                authorName  : oldMessage?.author?.username,
                guildId     : oldMessage?.guild?.id,
                guildName   : oldMessage?.guild?.name,
                content     : oldMessage?.content,
                embeds      : oldMessage?.embeds
            },
            newMessage : {
                id          : newMessage.id,
                channelType : newMessage?.channel?.type,
                channelName : newMessage?.channel?.name,
                authorId    : newMessage?.author?.id,
                authorName  : newMessage?.author?.username,
                guildId     : newMessage?.guild?.id,
                guildName   : newMessage?.guild?.name,
                content     : newMessage?.content,
                embeds      : newMessage?.embeds
            }
        });
    }
};
