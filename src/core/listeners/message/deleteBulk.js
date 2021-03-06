'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class messageDeleteBulkListener extends Listener {

    constructor() {

        super(Constants.Events.MESSAGE_BULK_DELETE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.MESSAGE_BULK_DELETE
        });
    }

    exec(messages) {

        this.client.logger.debug({
            event    : this.event,
            emitter  : this.emitter,
            messages : messages.map(([id, message]) => ({
                id,
                channelType         : message?.channel?.type,
                channelName         : message?.channel?.name,
                authorId            : message?.author?.id,
                authorName          : message?.author?.username,
                guildId             : message?.guild?.id,
                guildName           : message?.guild?.name,
                content             : message?.content,
                embeds              : message?.embeds
            }))
        });
    }
};
