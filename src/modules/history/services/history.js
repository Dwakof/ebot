'use strict';

const { Service } = require('../../../core');

module.exports = class HistoryService extends Service {

    /**
     * @param {Message} message
     *
     * @return {Promise}
     */
    upsertMessage(message) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        return Message.query()
            .insert({
                id        : message?.id,
                guildId   : message?.guild?.id,
                authorId  : message?.author?.id,
                content   : message?.content,
                createdAt : message?.createdAt,
                updatedAt : message?.editedAt || new Date()
            }).onConflict('id').merge();
    }

    async countMessage({ userId, guildId, channelId, after, before }) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const query = Message.query();

        if (userId) {

            query.where({ authorId : userId });
        }

        if (guildId) {

            query.where({ guildId });
        }

        if (channelId) {

            query.where({ channelId });
        }

        if (after) {

            query.where('createdAt', '>', after);
        }

        if (before) {

            query.where('createdAt', '<', before);
        }

        return (await query.resultSize()) || 0;
    }

    getMessages({ userId, guildId, channelId, after, before }) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const query = Message.query();

        if (userId) {

            query.where({ authorId : userId });
        }

        if (guildId) {

            query.where({ guildId });
        }

        if (channelId) {

            query.where({ channelId });
        }

        if (after) {

            query.where('createdAt', '>', after);
        }

        if (before) {

            query.where('createdAt', '<', before);
        }

        return query.toKnexQuery().asyncIterator();
    }
};
