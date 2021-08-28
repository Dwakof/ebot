'use strict';

module.exports = {

    NARCISSIST_RESPONSES : [
        (userId) => `Hey everyone ! <@${ userId }> is a narcissist !`
    ],

    INCREMENT_RESPONSES : [
        (userId, inc) => `<@${ userId }> +${ inc } !`,
        (userId, inc) => `<@${ userId }> gained ${ inc > 1 ? inc : 'a' } level${ inc > 1 ? 's' : '' } !`,
        (userId, inc) => `<@${ userId }> is on the rise !`,
        (userId, inc) => `Toss ${ inc > 1 ? inc : 'a' } karma to your <@${ userId }>, oh valley of plenty !`,
        (userId, inc) => `<@${ userId }> leveled up ${ inc > 1 ? `${ inc } times in a row` : '' } !`
    ],

    DECREMENT_RESPONSES : [
        (userId, inc) => `<@${ userId }> took ${ inc < -1 ? inc : 'a' } hit${ inc < -1 ? 's' : '' } ! Ouch.`,
        (userId, inc) => `<@${ userId }> took a dive.`,
        (userId, inc) => `<@${ userId }> lost ${ inc < -1 ? inc : 'a' } life${ inc < -1 ? 's' : '' }.`,
        (userId, inc) => `<@${ userId }> lost ${ inc < -1 ? inc : 'a' } level${ inc < -1 ? 's' : '' }.`
    ],

    randomResponse(array, ...args) {

        return array[Math.floor(Math.random() * array.length)](...args);
    },

    /**
     * @param {Object}       client  - Ebot Client
     * @param {String}       guildId - Guild ID
     * @param {String}       userId  - User ID
     * @param {Number}       value   - Value
     *
     * @return {Knex.QueryBuilder}
     */
    insertValue(client, guildId, userId, value) {

        const { Member } = client.providers.karma.models;

        return Member.query().insert({ guildId, userId, value }).returning('*');
    },

    ordinalSuffix(i) {

        const j = i % 10;
        const k = i % 100;

        if (j === 1 && k !== 11) {
            return 'st';
        }

        if (j === 2 && k !== 12) {
            return 'nd';
        }

        if (j === 3 && k !== 13) {
            return 'rd';
        }

        return 'th';
    },

    getInfoUser(client, guildId, userId) {

        const { Member } = client.providers.karma.models;

        return Member.query()
            .with('sumTable', Member.query()
                .select('guildId', 'userId')
                .sum({ karma : 'value' })
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
    },

    getStatsUser(client, guildId, userId) {

        const { Member } = client.providers.karma.models;

        const { fn, raw, ref } = Member;

        return Member.query()
            .with('info',
                Member.query().select({
                    min : fn.min(ref('createdAt')),
                    max : fn.now(),
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
    }
};
