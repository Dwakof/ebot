'use strict';

const { ClientUtil : Base } = require('discord-akairo');

const CoreUtil                  = require('./util');
const { memberNicknameMention } = require('@discordjs/builders');

module.exports = class ClientUtil extends Base {

    isString = CoreUtil.isString;

    REGEX_USER_MENTION    = /^<@![0-9]+>$/gi;
    REGEX_CHANNEL_MENTION = /^<#[0-9]+>$/gi;
    REGEX_URL             = CoreUtil.REGEX_URL;

    randomNumber = CoreUtil.randomNumber;
    randomInt    = CoreUtil.randomInt;
    randomValue  = CoreUtil.randomValue;

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    }

    code(string) {

        return `\`${ string }\``;
    }

    codeBlock(string) {

        return `\`\`\`${ string }\`\`\``;
    }

    progressBar(value = 0, maxValue = 100, options = {}) {

        const { size = 20, progress = '⣿', half = '⣇', empty = '⣀', start = '', end = '', text = true } = options;

        const percentage = Math.min(value / maxValue, 1);          // Calculate the percentage of the bar
        const current    = Math.floor((size * percentage));               // Calculate the number of progress characters to fill the progress side.
        const between    = Math.round(size * percentage) - current;    // Calculate the number of half characters (should be 0 or 1)
        let left         = Math.max(size - current - between, 0);  // Calculate the number of empty characters to fill the empty progress side.

        if (Math.floor(size * percentage) > current) {
            left--;
        }

        let result = `${ start }${ progress.repeat(current) }${ half.repeat(between) }${ empty.repeat(left) }${ end }`;

        if (text) { // Displaying the percentage of the bar

            result += `${ Math.round(percentage * 100) }%`.padStart(5, ' ');
        }

        return this.codeBlock(result);
    }

    debounce(func, timeout = 300) {

        let interval;

        return (...args) => {

            clearTimeout(interval);

            interval = setTimeout(() => func(...args), timeout);
        };
    }

    wait(timeout = 1000) {

        return new Promise((fulfil) => {

            setTimeout(fulfil, timeout);
        });
    }

    ownerIds() {

        return this.client.ownerID.map(memberNicknameMention).join(', ');
    }

    chunk(array, chunkSize = 10) {

        return array.reduce((acc, each, index, src) => {

            if (!(index % chunkSize)) {
                return [...acc, src.slice(index, index + chunkSize)];
            }

            return acc;
        }, []);
    }

    /**
     * @param {User} user
     */
    username(user) {

        if (!user) {

            return false;
        }

        return `${ user.username }#${ user.discriminator }`;
    }

    memoize = CoreUtil.memoize;
};
