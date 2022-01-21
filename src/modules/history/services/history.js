'use strict';

const { Service } = require('../../../core');

module.exports = class HistoryService extends Service {

    /**
     * @param {Message} message
     *
     * @return {Promise}
     */
    async upsertMessage(message) {

        const { SyncService } = this.services();

        const { History } = this.providers();

        const { Message, Emoji } = History.models;

        const msg = Message.query()
            .insert(SyncService.toMessage([message])).onConflict(Message.idColumn).merge();

        await Emoji.query().where({ messageId : message.id }).delete();

        const emojis = await SyncService.toEmoji(message);

        if (emojis.length > 0) {

            await Emoji.query().insert(emojis).onConflict(Emoji.idColumn).ignore();
        }

        return msg;
    }

    baseQuery({ userId, guildId, channelId, after, before }) {

        const { History } = this.providers();

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

        return query;
    }

    async countMessages(conditions) {

        return (await this.baseQuery(conditions).resultSize()) || 0;
    }

    getMessages(conditions) {

        return this.baseQuery(conditions).toKnexQuery().asyncIterator();
    }
};
