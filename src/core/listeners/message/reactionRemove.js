'use strict';

const { Events }   = require('discord.js');
const { Listener } = require('../../');

module.exports = class MessageReactionRemoveListener extends Listener {

    constructor() {

        super(Events.MessageReactionRemove, { category : 'core', emitter : 'client' });
    }

    exec(reaction, user) {

        this.client.logger.debug({
            msg      : `User "${ user.username }" removed their reaction "${ reaction.emoji.name }" on message "${ reaction.message.id }" in channel "${ reaction.message?.channel?.name }" in guild "${ reaction.message?.guild?.name }"`,
            event    : this.event,
            emitter  : this.emitter,
            reaction : {
                count       : reaction?.count,
                ebotReacted : reaction?.me,
                message     : {
                    id          : reaction.message.id,
                    channelType : reaction.message?.channel?.type,
                    channelName : reaction.message?.channel?.name,
                    channelId   : reaction.message?.channel?.id,
                    authorId    : reaction.message?.author?.id,
                    authorName  : reaction.message?.author?.username,
                    guildId     : reaction.message?.guild?.id,
                    guildName   : reaction.message?.guild?.name
                },
                emoji       : {
                    id         : reaction.emoji.id,
                    identifier : reaction.emoji.identifier,
                    name       : reaction.emoji.name,
                    guildId    : reaction.emoji?.guild?.id,
                    guildName  : reaction.emoji?.guild?.name
                },
                user        : {
                    isBot    : user.bot,
                    id       : user.id,
                    username : user.username
                }
            }
        });
    }
};
