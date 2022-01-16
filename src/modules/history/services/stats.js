'use strict';

const { Service } = require('../../../core');

module.exports = class StatsService extends Service {

    filter(model, options) {

        const { fn, raw } = model;

        const { authorId, guildId, channelId, after = raw('to_timestamp(?)', [0]), before = fn.now() } = options;

        const where = {};

        if (guildId) {

            where.guildId = guildId;
        }

        if (authorId) {

            where.authorId = authorId;
        }

        if (channelId) {

            where.channelId = channelId;
        }

        return { where, after, before };
    }

    _baseQueryActivity(model, options = {}) {

        const { fn, raw, ref } = model;

        const { after, before, period = 'hour', where = {}, idColumn = 'id' } = options;

        return model.query()
            .with('info', model.query().select({ min : fn.min(ref('createdAt')), max : fn.max(ref('createdAt')) }).where(where))
            .with('periods',
                model.query().select({
                    period : raw(`GENERATE_SERIES( DATE_TRUNC(?, GREATEST(?::DATE, ??)), DATE_TRUNC(?, LEAST(?::DATE, ??)), ?::interval )`,
                        [
                            period, after, ref('min').from('info'),
                            period, before, ref('max').from('info'),
                            `1 ${ period }`
                        ]
                    )
                }).from('info'))
            .with('stats',
                model.query().select({
                    period : ref('period').from('periods'),
                    total  : fn.count(ref(idColumn).from(model.tableName))
                }).from('periods')
                    .leftOuterJoin(model.tableName, function () {

                        this.on(ref('period').from('periods'), '=', raw(`DATE_TRUNC(?, ??)`, [period, ref('createdAt').from(model.tableName)]));

                        for (const key of Object.keys(where)) {

                            this.andOn(ref(key).from(model.tableName), '=', raw(`?`, [where[key]]));
                        }
                    })
                    .groupBy('period')
            );
    }

    /**
     * @param {Object} options
     *
     * @return {Promise<string>} message ID
     */
    mostReactedMessage(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji, Message } = History.models;

        const { fn, ref } = Emoji;

        const { where : { authorId, ...where }, after, before } = this.filter(Emoji, options);

        const query = Emoji.query()
            .select({
                guildId   : ref('guildId'),
                channelId : ref('channelId'),
                messageId : ref('messageId'),
                count     : fn.count(ref('emoji'))
            })
            .where(where)
            .where({ type : 'reaction' })
            .whereBetween('createdAt', [after, before]);

        if (authorId) {

            query.whereIn('messageId', Message.query().select('id').where({ ...where, authorId }));
        }

        return query.groupBy(['guildId', 'channelId', 'messageId']).orderBy('count', 'desc').having(fn.count(ref('emoji')), '>', 0).limit(1).first();
    }

    mostUsedEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { fn, ref } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { limit = 12 } = options;

        return Emoji.query()
            .select({
                emoji : ref('emoji'),
                count : fn.count(ref('emoji'))
            })
            .where(where)
            .where({ type : 'message' })
            .whereBetween('createdAt', [after, before])
            .groupBy(['emoji'])
            .orderBy('count', 'desc').limit(limit);
    }

    countUsedEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { where, after, before } = this.filter(Emoji, options);

        return Emoji.query()
            .where(where)
            .whereBetween('createdAt', [after, before])
            .resultSize();
    }

    async averageEmojiPerPeriod(options) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { fn, ref } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { period = 'hour' } = options;

        const { value } = await this._baseQueryActivity(Emoji, { where, before, after, period, idColumn : 'emoji' })
            .select({ value : fn.avg(ref('total').from('stats')) })
            .from('stats').first();

        return parseInt(value) || 0;
    }

    async averageEmojiPerMessageOverTime(options = {}) {

        const { History } = this.client.providers('history');

        const { Message, Emoji } = History.models;

        const { fn, raw, ref } = Message;

        const { datapoint = 50 } = options;

        const { where, after, before } = this.filter(Message, options);

        const stats = await Message.query()
            .with('info',
                Message.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM LEAST(?::DATE, ??) - GREATEST(?::DATE, ??))`, [before, fn.now(), after, fn.min(ref('createdAt'))])
                }).where(where)
            )
            .with('periods',
                Message.query().select({
                    interval : raw('FLOOR(?? / ?)::bigint', [ref('interval').from('info'), datapoint]),
                    after    : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM GREATEST(?::DATE, ??))::bigint,
                                EXTRACT(EPOCH FROM LEAST(?::DATE, ??))::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, [
                        after, ref('min').from('info'),
                        before, ref('max').from('info'),
                        ref('interval').from('info'), datapoint
                    ])
                }).from('info')
            )
            .select({
                after    : ref('after').from('periods'),
                time     : raw('TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ?? / 2)', [ref('after').from('periods'), ref('interval').from('periods')]),
                messages : Message.query()
                    .count('*')
                    .where(where)
                    .where('createdAt', '>=', ref('after').from('periods'))
                    .whereRaw('?? < TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ??)', [
                        ref('createdAt'),
                        ref('after').from('periods'),
                        ref('interval').from('periods')
                    ]),
                emojis   : Emoji.query()
                    .count('*')
                    .where(where)
                    .where({ type : 'message' })
                    .where('createdAt', '>=', ref('after').from('periods'))
                    .whereRaw('?? < TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ??)', [
                        ref('createdAt').from(Emoji.tableName),
                        ref('after').from('periods'),
                        ref('interval').from('periods')
                    ])
            }).from('periods').orderBy('time');

        return stats.map(({ time, messages, emojis }) => {

            const messagesValue = parseInt(messages) || 0;
            const emojisValue   = parseInt(emojis) || 0;

            return {
                time     : new Date(time),
                messages : messagesValue,
                emojis   : emojisValue,
                average  : messagesValue !== 0 ? emojisValue / messagesValue : 0
            };

        }).slice(0, datapoint);
    }

    rankingUsersPerEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { ref, raw } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { limit } = options;

        const query = Emoji.query()
            .with('sumTable', Emoji.query()
                .select({
                    authorId : ref('authorId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : raw(`COUNT(??)`, [ref('emoji')])
                })
                .where(where)
                .where({ type : 'message' })
                .whereBetween(ref('createdAt'), [after, before])
                .groupBy(...Object.keys(where), 'authorId')
            )
            .with('ranking', Emoji.query()
                .select({
                    authorId : ref('authorId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : ref('count').from('sumTable'),
                    rank  : raw('RANK() OVER ( ORDER BY ?? DESC )', [ref('count').from('sumTable')])
                })
                .from('sumTable')
                .orderBy('rank', 'asc')
            )
            .select('*', raw('MAX(??) OVER ()', [ref('rank').from('ranking')]).as('total'))
            .from('ranking');

        if (limit) {

            query.limit(limit);
        }

        return query;
    }

    rankOfUserForEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { authorId, ..._options } = options;

        return Emoji.query()
            .from(this.rankingUsersPerEmoji(_options).as('rank'))
            .where({ authorId })
            .first();
    }

    mostUsedReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { fn, ref } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { limit = 6 } = options;

        where.type = 'reaction';

        return Emoji.query()
            .select({
                emoji : ref('emoji'),
                count : fn.count(ref('emoji'))
            })
            .where(where)
            .whereBetween('createdAt', [after, before])
            .groupBy('emoji')
            .orderBy('count', 'desc').limit(limit);
    }

    mostReceivedReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji, Message } = History.models;

        const { fn, ref } = Emoji;

        const { where : { authorId, ...where }, after, before } = this.filter(Emoji, options);

        const { limit = 6 } = options;

        const query = Emoji.query()
            .select({
                emoji : ref('emoji'),
                count : fn.count(ref('emoji'))
            })
            .where(where)
            .where({ type : 'reaction' })
            .whereBetween('createdAt', [after, before]);

        if (authorId) {

            query.whereIn('messageId', Message.query().select('id').where({ ...where, authorId }));
        }

        return query.groupBy('emoji').orderBy('count', 'desc').limit(limit);
    }

    countReceivedReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji, Message } = History.models;

        const { where : { authorId, ...where }, after, before } = this.filter(Emoji, options);

        const query = Emoji.query()
            .where(where)
            .where({ type : 'reaction' })
            .whereBetween('createdAt', [after, before]);

        if (authorId) {

            query.whereIn('messageId', Message.query().select('id').where({ ...where, authorId }));
        }

        return query.resultSize();
    }

    countGivenReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { where, after, before } = this.filter(Emoji, options);

        return Emoji.query()
            .where(where)
            .where({ type : 'reaction' })
            .whereBetween('createdAt', [after, before])
            .resultSize();
    }

    topUserReceivedReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { fn, ref, raw } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { limit = 3 } = options;

        const query = Emoji.query()
            .select({
                authorId : ref('message.authorId'),
                count    : fn.count(ref('emoji'))
            })
            .innerJoinRelated('message')
            .where({ type : 'reaction' })
            .whereBetween(ref('createdAt'), [after, before]);

        for (const key of Object.keys(where)) {

            query.where(ref(key).from(Emoji.tableName), '=', raw(`?`, [where[key]]));
        }

        return query.groupBy('message.authorId').orderBy('count', 'desc').limit(limit);
    }

    topUserGivenReactionEmoji(options = {}) {

        const { History } = this.client.providers('history');

        const { Emoji } = History.models;

        const { fn, ref } = Emoji;

        const { where, after, before } = this.filter(Emoji, options);

        const { limit = 3 } = options;

        const query = Emoji.query()
            .select({
                authorId : ref('authorId'),
                count    : fn.count(ref('emoji'))
            })
            .where(where)
            .where({ type : 'reaction' })
            .whereBetween(ref('createdAt'), [after, before]);

        return query.groupBy('authorId').orderBy('count', 'desc').limit(limit);
    }

    async countMessageOverTime(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { datapoint = 50 } = options;

        const { where, after, before } = this.filter(Message, options);

        const stats = await Message.query()
            .with('info',
                Message.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM LEAST(?::DATE, ??) - GREATEST(?::DATE, ??))`, [before, fn.now(), after, fn.min(ref('createdAt'))])
                }).where(where)
            )
            .with('periods',
                Message.query().select({
                    interval : raw('FLOOR(?? / ?)::bigint', [ref('interval').from('info'), datapoint]),
                    after    : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM GREATEST(?::DATE, ??))::bigint,
                                EXTRACT(EPOCH FROM LEAST(?::DATE, ??))::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, [
                        after, ref('min').from('info'),
                        before, ref('max').from('info'),
                        ref('interval').from('info'), datapoint
                    ])
                }).from('info')
            )
            .select({
                after : ref('after').from('periods'),
                time  : raw('TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ?? / 2)', [ref('after').from('periods'), ref('interval').from('periods')]),
                value : Message.query()
                    .count('*')
                    .from(Message.tableName)
                    .where(where)
                    .where('createdAt', '>=', ref('after').from('periods'))
                    .whereRaw('?? < TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ??)', [
                        ref('createdAt'),
                        ref('after').from('periods'),
                        ref('interval').from('periods')
                    ])
            }).from('periods').orderBy('time');

        return stats.map(({ time, value }) => {

            return { time : new Date(time), value : parseFloat(value) || 0 };
        }).slice(0, datapoint);
    }

    async dailyActivity(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { where, before } = this.filter(Message, options);

        const { after = raw('to_timestamp(?)', [0]) } = options;

        const stats = await this._baseQueryActivity(Message, { where, before, after, period : 'hour' })
            .select({
                hour  : raw(`DATE_PART('hour', ??)`, [ref('period').from('stats')]),
                value : fn.avg(ref('total').from('stats'))
            })
            .from('stats')
            .groupBy('hour')
            .orderBy('hour');

        return stats.map(({ hour, value }) => {

            return { hour : parseInt(hour), value : parseFloat(value) || 0 };
        });
    }

    async weeklyActivity(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { where, before, after } = this.filter(Message, options);

        const { interval = 24 } = options;

        const stats = await this._baseQueryActivity(Message, { where, before, after, period : 'hour' })
            .select({
                day   : raw(`DATE_PART('dow', ??)`, [ref('period').from('stats')]),
                hour  : raw(`FLOOR(DATE_PART('hour', ??) / ?) * ?`, [ref('period').from('stats'), 24 / (interval), 24 / (interval)]),
                value : fn.avg(ref('total').from('stats'))
            })
            .from('stats')
            .groupBy('day', 'hour')
            .orderBy(['day', 'hour']);

        return stats.map(({ day, hour, value }) => {

            return { day : parseInt(day), hour : parseInt(hour), value : parseFloat(value) || 0 };
        });
    }

    async averageMessagePerPeriod(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, ref } = Message;

        const { where, after, before } = this.filter(Message, options);

        const { period = 'hour' } = options;

        const { value } = await this._baseQueryActivity(Message, { where, before, after, period })
            .select({ value : fn.avg(ref('total').from('stats')) })
            .from('stats').first();

        return parseFloat(value) || 0;
    }

    mostActivePeriod(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { ref } = Message;

        const { where, after, before } = this.filter(Message, options);

        const { period = 'hour' } = options;

        return this._baseQueryActivity(Message, { where, before, after, period })
            .select({
                time    : ref('period').from('stats'),
                message : ref('total').from('stats')
            })
            .from('stats')
            .orderBy('message', 'desc')
            .first();
    }

    topUserMessages(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, ref } = Message;

        const { where, after, before } = this.filter(Message, options);

        const { limit = 6 } = options;

        const query = Message.query()
            .select({
                authorId : ref('authorId'),
                count    : fn.count(ref('id'))
            })
            .where(where)
            .whereBetween(ref('createdAt'), [after, before]);

        return query.groupBy('authorId').orderBy('count', 'desc').limit(limit);
    }

    rankingUsersPerMessages(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { ref, raw } = Message;

        const { where, after, before } = this.filter(Message, options);

        const { limit } = options;

        const query = Message.query()
            .with('sumTable', Message.query()
                .select({
                    authorId : ref('authorId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : raw(`COUNT(??)`, [ref('id')])
                })
                .where(where)
                .whereBetween(ref('createdAt'), [after, before])
                .groupBy(...Object.keys(where), 'authorId')
            )
            .with('ranking', Message.query()
                .select({
                    authorId : ref('authorId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : ref('count').from('sumTable'),
                    rank  : raw('RANK() OVER ( ORDER BY ?? DESC )', [ref('count').from('sumTable')])
                })
                .from('sumTable')
                .orderBy('rank', 'asc')
            )
            .select('*', raw('MAX(??) OVER ()', [ref('rank').from('ranking')]).as('total'))
            .from('ranking');

        if (limit) {

            query.limit(limit);
        }

        return query;
    }

    rankingChannelsPerMessages(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { ref, raw } = Message;

        const { where, after, before } = this.filter(Message, options);

        const { limit } = options;

        const query = Message.query()
            .with('sumTable', Message.query()
                .select({
                    channelId : ref('channelId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : raw(`COUNT(??)`, [ref('id')])
                })
                .where(where)
                .whereBetween(ref('createdAt'), [after, before])
                .groupBy(...Object.keys(where), 'channelId')
            )
            .with('ranking', Message.query()
                .select({
                    channelId : ref('channelId'),
                    ...Object.keys(where).reduce((acc, key) => ({ ...acc, [key] : ref(key) }), {}),
                    count : ref('count').from('sumTable'),
                    rank  : raw('RANK() OVER ( ORDER BY ?? DESC )', [ref('count').from('sumTable')])
                })
                .from('sumTable')
                .orderBy('rank', 'asc')
            )
            .select('*', raw('MAX(??) OVER ()', [ref('rank').from('ranking')]).as('total'))
            .from('ranking');

        if (limit) {

            query.limit(limit);
        }

        return query;
    }

    rankOfUserForMessage(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { authorId, ..._options } = options;

        return Message.query()
            .from(this.rankingUsersPerMessages(_options).as('rank'))
            .where({ authorId })
            .first();
    }

    async firstAndLastMessages(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { ref } = Message;

        const { where, after, before } = this.filter(Message, options);

        return {
            first : await Message.query()
                .select('id', 'authorId', 'channelId', 'guildId', 'createdAt')
                .whereBetween(ref('createdAt'), [after, before])
                .where(where)
                .orderBy('createdAt', 'ASC')
                .first(),
            last  : await Message.query()
                .select('id', 'authorId', 'channelId', 'guildId', 'createdAt')
                .whereBetween(ref('createdAt'), [after, before])
                .where(where)
                .orderBy('createdAt', 'DESC')
                .first()
        };
    }
};
