'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment } = require('discord.js');

const { Service } = require('../../../core');

module.exports = class StatsService extends Service {

    filter(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw } = Message;

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

    _baseQueryActivity(options = {}) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { after, before, period = 'hour', where = {} } = options;

        return Message.query()
            .with('info', Message.query().select({ min : fn.min(ref('createdAt')), max : fn.max(ref('createdAt')) }).where(where))
            .with('periods',
                Message.query().select({
                    period : raw(`GENERATE_SERIES( DATE_TRUNC(?, GREATEST(?::DATE, ??)), DATE_TRUNC(?, LEAST(?::DATE, ??)), ?::interval )`,
                        [
                            period, after, ref('min').from('info'),
                            period, before, ref('max').from('info'),
                            `1 ${ period }`
                        ]
                    )
                }).from('info'))
            .with('stats',
                Message.query().select({
                    period : ref('period').from('periods'),
                    total  : fn.count(ref('id').from(Message.tableName))
                }).from('periods')
                    .leftOuterJoin(Message.tableName, function () {

                        this.on(ref('period').from('periods'), '=', raw(`DATE_TRUNC(?, ??)`, [period, ref('createdAt').from(Message.tableName)]));

                        for (const key of Object.keys(where)) {

                            this.andOn(ref(key).from(Message.tableName), '=', raw(`?`, [where[key]]));
                        }
                    })
                    .groupBy('period')
            );
    }

    async getCountMessageOverTime(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { datapoint = 50 } = options;

        const { where, after, before } = this.filter(options);

        const stats = await Message.query()
            .with('info',
                Message.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM ?? - ??)`, [before, after])
                }).where(where)
            )
            .with('periods',
                Message.query().select({
                    interval : raw('FLOOR(?? / ?)::bigint', ['interval', datapoint]),
                    after    : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM ??)::bigint,
                                EXTRACT(EPOCH FROM ??)::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, ['min', 'max', 'interval', datapoint])
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

    async getHourlyActivity(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { where, before } = this.filter(options);

        const { after = raw('to_timestamp(?)', [0]) } = options;

        const stats = await this._baseQueryActivity({ where, before, after, period : 'hour' })
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

    async getWeeklyActivity(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { where, before, after } = this.filter(options);

        const { interval = 24 } = options;

        const stats = await this._baseQueryActivity({ where, before, after, period : 'hour' })
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

    async getAverageMessagePerPeriod(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, ref } = Message;

        const { where, after, before } = this.filter(options);

        const { period = 'hour' } = options;

        const { value } = await this._baseQueryActivity({ where, before, after, period })
            .select({ value : fn.avg(ref('total').from('stats')) })
            .from('stats').first();

        return parseInt(value) || 0;
    }
};
