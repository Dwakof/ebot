'use strict';

module.exports = {

    REGEX_KARMA           : /(\w+|<@![0-9]+>)(\+\+|--|\+5|-5)/gmi,
    REGEX_DISCORD_USER_ID : /^<@![0-9]+>$/gi,

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
    }
};
