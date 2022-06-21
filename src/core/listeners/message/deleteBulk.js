'use strict';

const { Constants } = require('discord.js');
const { Listener }  = require('../../');

module.exports = class MessageDeleteBulkListener extends Listener {

    constructor() {

        super(Constants.Events.MESSAGE_BULK_DELETE, {
            category : 'core',
            emitter  : 'client',
            event    : Constants.Events.MESSAGE_BULK_DELETE
        });
    }

    exec(messages) {

        this.client.logger.debug({
            msg      : `${ messages.length } messages were deleted`,
            event    : this.event,
            emitter  : this.emitter,
            messages : messages.map(([id, message]) => ({
                id,
                channelType : message?.channel?.type,
                channelName : message?.channel?.name,
                authorId    : message?.author?.id,
                authorName  : message?.author?.username,
                guildId     : message?.guild?.id,
                guildName   : message?.guild?.name,
                content     : message?.content,
                embeds      : message?.embeds
            }))
        });
    }
};
