'use strict';

const { Service } = require('../../../core');

module.exports = class ReplyService extends Service {

    /**
     *
     * @param {Message} message
     * @param {String}  userId
     *
     * @return {Promise}
     */
    saveReply(message, userId) {

        const { Mimic } = this.providers();

        const { Reply } = Mimic.models;

        return Reply.query().insert({
            messageId : message.id,
            guildId   : message.guild.id,
            content   : message.cleanContent,
            userId
        });
    }

    #baseQuery({ guildId, after, before }) {

        const { Mimic } = this.providers();

        const { Reply } = Mimic.models;

        const query = Reply.query();

        if (guildId) {

            query.where({ guildId });
        }

        if (after) {

            query.where('createdAt', '>', after);
        }

        if (before) {

            query.where('createdAt', '<', before);
        }

        return query;
    }

    async countReplies(conditions) {

        return (await this.#baseQuery(conditions).resultSize()) || 0;
    }

    getReplies(conditions) {

        return this.#baseQuery(conditions).toKnexQuery().asyncIterator();
    }
};
