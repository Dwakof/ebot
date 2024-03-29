'use strict';

// eslint-disable-next-line no-unused-vars
const { Snowflake, GuildMember } = require('discord.js');

const { Service } = require('../../../core');

module.exports = class KarmaService extends Service {

    REGEX_KARMA = /(\w+|<@![0-9]+>)(\+\+|--|\+5|-5)/gmi;

    TYPES = { REACTION : 'reaction', MESSAGE : 'message' };

    NARCISSIST_RESPONSES = [
        ({ displayName }) => `Hey everyone ! ${ displayName } is a narcissist !`
    ];

    INCREMENT_RESPONSES = [
        ({ displayName }, inc) => `${ displayName } +${ inc } !`,
        ({ displayName }, inc) => `${ displayName } gained ${ inc > 1 ? inc : 'a' } level${ inc > 1 ? 's' : '' } !`,
        ({ displayName }, inc) => `${ displayName } is on the rise ! (${ inc } point${ inc > 1 ? 's' : '' })`,
        ({ displayName }, inc) => `Toss ${ inc > 1 ? inc : 'a' } karma to your ${ displayName }, oh valley of plenty !`,
        ({ displayName }, inc) => `${ displayName } leveled up ${ inc > 1 ? `${ inc } times in a row` : '' } !`
    ];

    DECREMENT_RESPONSES = [
        ({ displayName }, inc) => `${ displayName } took ${ inc < -1 ? inc : 'a' } hit${ inc < -1 ? 's' : '' } ! Ouch.`,
        ({ displayName }, inc) => `${ displayName } took a dive (${ inc } point${ inc < -1 ? 's' : '' }).`,
        ({ displayName }, inc) => `${ displayName } lost ${ inc < -1 ? inc : 'a' } life${ inc < -1 ? 's' : '' }.`,
        ({ displayName }, inc) => `${ displayName } lost ${ inc < -1 ? inc : 'a' } level${ inc < -1 ? 's' : '' }.`
    ];

    randomResponse(array, ...args) {

        return array[Math.floor(Math.random() * array.length)](...args);
    }

    emojiToValue(emoji) {

        switch (decodeURIComponent(emoji)) {
            case '⬆️':
                return 1;
            case '🏅':
                return 5;
            case '⬇️':
                return -1;
            case '🍅':
                return -5;
            default:
                return null;
        }
    }

    /**
     * @param {string} guildId
     * @param {string} userId
     *
     * @return {KarmaUserInfo|null}
     */
    getInfoUser(guildId, userId) {

        const { Karma } = this.providers();

        const { Member } = Karma.models;

        return Member.query()
            .with('sumTable', Member.query()
                .select('guildId', 'userId')
                .count({ transaction : '*' })
                .sum({ karma : 'value' })
                .min({ first : 'createdAt' })
                .groupBy('guildId', 'userId')
            )
            .with('rankTable', Member.query()
                .select([
                    '*',
                    Member.knex().raw('RANK() OVER ( ORDER BY karma DESC ) rank'),
                    Member.knex().raw(`COUNT(*) OVER () total`)
                ])
                .from('sumTable')
            )
            .from('rankTable')
            .where({ guildId, userId })
            .limit(1).first();
    }

    /**
     * @param {string} guildId
     * @param {string} userId
     *
     * @return {Promise<KarmaUserStats[]>}
     */
    async getStatsUser(guildId, userId) {

        const { Karma } = this.providers();

        const { Member } = Karma.models;

        const { fn, raw, ref } = Member;

        const stats = await Member.query()
            .with('info',
                Member.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM ?? - ??)`, [
                        fn.now(),
                        fn.min(ref('createdAt'))
                    ])
                }).where({ guildId, userId })
            )
            .with('periods',
                Member.query().select({
                    period : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM ??)::bigint,
                                EXTRACT(EPOCH FROM ??)::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, ['min', 'max', 'interval', 50])
                }).from('info')
            )
            .select({
                time  : raw('??::timestamp', ['period']),
                value : Member.query()
                    .select(fn.coalesce(fn.sum(ref('value')), 0))
                    .from(Member.tableName)
                    .where({ guildId, userId })
                    .where('createdAt', '<', ref('period').from('periods'))
            }).from('periods');

        return stats.map(({ time, value }) => {

            return { time : new Date(time), value : parseFloat(value) };
        });
    }

    /**
     * @param {Message} message
     *
     * @return {Promise<Map<Snowflake, { member : GuildMember, value : integer }>>}
     */
    async parseMessage(message) {

        const users = new Map();

        const matches = message.content.match(this.REGEX_KARMA);

        if (Array.isArray(matches)) {

            for (const string of matches) {

                const nameOrId = string.slice(0, -2);

                let value = 0;

                switch (string.slice(-2)) {
                    case '++':
                        value = 1;
                        break;
                    case '+5':
                        value = 5;
                        break;
                    case '--':
                        value = -1;
                        break;
                    case '-5':
                        value = -5;
                        break;
                    default:
                        return;
                }

                if (this.client.util.REGEX_USER_MENTION.test(string.slice(0, -2))) {

                    const id = nameOrId.slice(3, nameOrId.length - 1);

                    const member = await message.guild.members.fetch(id);

                    users.set(member.id, { member, value });

                    continue;
                }

                const [[id, member]] = await message.guild.members.fetch({ query : nameOrId, limit : 1 });

                if (!member.deleted) {

                    users.set(id, { member, value });
                }

            }
        }

        return users;
    }

    /**
     * @param {Object}     karma
     * @param {Snowflake}  karma.guildId
     * @param {Snowflake}  karma.userId
     * @param {Snowflake}  karma.messageId
     * @param {Snowflake}  karma.giverId
     * @param {String}     karma.type
     * @param {Number}     karma.value
     *
     * @return {Promise}
     */
    addKarma(karma) {

        const { Karma } = this.providers();

        const { Member } = Karma.models;

        return Member.query().insert(karma)
            .onConflict(['guildId', 'userId', 'messageId', 'giverId', 'type', 'value']).ignore();
    }

    /**
     * @param {Snowflake}  guildId
     * @param {Snowflake}  userId
     * @param {Snowflake}  messageId
     * @param {Snowflake}  giverId
     * @param {String}     type
     * @param {Number}     value
     *
     * @return {Promise}
     */
    cancelKarma({ guildId, userId, messageId, giverId, type, value }) {

        const { Karma } = this.providers();

        const { Member } = Karma.models;

        return Member.query().deleteById([guildId, userId, messageId, giverId, type, value]);
    }
};

/**
 * @typedef {Object} KarmaUserInfo
 *
 * @property {Snowflake} guildId
 * @property {Snowflake} userId
 * @property {number}    transaction
 * @property {number}    karma
 * @property {number}    rank
 * @property {number}    total
 * @property {string}    first
 */

/**
 * @typedef {Object} KarmaUserStats
 *
 * @property {Date}   time
 * @property {number} value
 */
