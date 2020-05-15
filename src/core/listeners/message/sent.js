'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class messageSentListener extends Listener {

    constructor() {

        super(Constants.Events.MESSAGE_CREATE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.MESSAGE_CREATE
        });
    }

    exec(message) {

        this.client.logger.debug({
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
