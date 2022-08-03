'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class MessageDeleteListener extends Listener {

    constructor() {

        super(Events.MessageDelete, { category : 'core', emitter : 'client' });
    }

    exec(message) {

        this.client.logger.debug({
            msg     : `Message ${ message.id } in channel "${ message?.channel?.name }" in guild "${ message?.guild?.name }" was deleted`,
            event   : this.event,
            emitter : this.emitter,
            message : {
                id          : message.id,
                channelType : message?.channel?.type,
                channelName : message?.channel?.name,
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
