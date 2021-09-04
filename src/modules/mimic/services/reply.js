'use strict';

const Service = require('../../../core/service');

module.exports = class ReplyService extends Service {

    /**
     *
     * @param {Message} message
     * @param {String}  userId
     *
     * @return {Promise}
     */
    saveReply(message, userId) {

        const { Mimic } = this.client.providers('mimic');

        const { Reply } = Mimic.models;

        return Reply.query().insert({
            messageId : message.id,
            guildId   : message.guild.id,
            content   : message.cleanContent,
            userId
        });
    }
};
