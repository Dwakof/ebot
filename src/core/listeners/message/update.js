'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class messageUpdateListener extends Listener {

    constructor() {

        super(Constants.Events.MESSAGE_UPDATE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.MESSAGE_UPDATE
        });
    }

    exec(oldMessage, newMessage) {

        this.client.logger.debug({
            event   : this.event,
            emitter : this.emitter,
            oldMessage : {
                id                  : oldMessage.id,
                channelType         : oldMessage?.channel?.type,
                channelName         : oldMessage?.channel?.name,
                authorId            : oldMessage?.author?.id,
                authorName          : oldMessage?.author?.username,
                guildId             : oldMessage?.guild?.id,
                guildName           : oldMessage?.guild?.name,
                content             : oldMessage?.content,
                embeds              : oldMessage?.embeds
            },
            newMessage : {
                id                  : newMessage.id,
                channelType         : newMessage?.channel?.type,
                channelName         : newMessage?.channel?.name,
                authorId            : newMessage?.author?.id,
                authorName          : newMessage?.author?.username,
                guildId             : newMessage?.guild?.id,
                guildName           : newMessage?.guild?.name,
                content             : newMessage?.content,
                embeds              : newMessage?.embeds
            }
        });
    }
};
