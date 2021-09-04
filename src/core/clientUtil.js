'use strict';

const { ClientUtil : Base } = require('discord-akairo');

const CoreUtil = require('./util');

module.exports = class ClientUtil extends Base {

    isString = CoreUtil.isString;

    REGEX_USER_MENTION    = /^<@![0-9]+>$/gi;
    REGEX_CHANNEL_MENTION = /^<#[0-9]+>$/gi;

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    }

    code(string) {

        return `\`${ string }\``;
    }

    codeBlock(string) {

        return `\`\`\`${ string }\`\`\``;
    }

    /**
     * Returns a random integer between the specified values. The value is no lower than min
     * (or the next integer greater than min if min isn't an integer), and is less than (but
     * not equal to) max.
     */
    randomNumber(min = 0, max = 1) {

        return Math.random() * (max - min) + min;
    }

    randomInt(min, max) {

        return Math.round(this.randomNumber(min, max));
    }

    randomValue(array = []) {

        return array[this.randomInt(0, array.length - 1)] || undefined;
    }

    progressBar(value = 0, maxValue = 100, options = {}) {

        const { size = 20, progress = '⣿', half = '⣇', empty = '⣀', start = '', end = '', text = true } = options;

        const percentage = Math.min(value / maxValue, 1);          // Calculate the percentage of the bar
        const current    = Math.floor((size * percentage));               // Calculate the number of progress characters to fill the progress side.
        let   between    = Math.round(size * percentage) - current;    // Calculate the number of half characters (should be 0 or 1)
        let   left       = Math.max(size - current - between, 0);  // Calculate the number of empty characters to fill the empty progress side.

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

        let timer;

        return (...args) => {

            clearTimeout(timer);

            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    wait(timeout = 1000) {

        return new Promise((fulfil) => {

            setTimeout(fulfil, timeout);
        })
    }

    ownerIds() {

        return this.client.ownerID.map((id) => `<@${ id }>`).join(', ')
    }
};
