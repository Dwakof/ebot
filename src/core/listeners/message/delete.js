'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class messageDeleteListener extends Listener {

    constructor() {

        super(Constants.Events.MESSAGE_DELETE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.MESSAGE_DELETE
        });
    }

    exec(message) {

        this.client.logger.debug({
            event   : this.event,
            emitter : this.emitter,
            message : {
                id                  : message.id,
                channelType         : message?.channel?.type,
                channelName         : message?.channel?.name,
                authorId            : message?.author?.id,
                authorName          : message?.author?.username,
                guildId             : message?.guild?.id,
                guildName           : message?.guild?.name,
                content             : message?.content,
                embeds              : message?.embeds
            }
        });
    }
};
