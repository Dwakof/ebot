'use strict';

const { ClientUtil : Base } = require('discord-akairo');

const Util = require('util');

const { Message, Interaction } = require('discord.js');

// eslint-disable-next-line no-unused-vars
const { MessagePayload, MessageOptions, WebhookEditMessageOptions, MessageEmbed } = require('discord.js');

const { memberNicknameMention, codeBlock, inlineCode } = require('@discordjs/builders');

const CoreUtil = require('./util');

/**
 * Client utilities to help with common tasks.
 * @param {EbotClient} client - The client.
 */
module.exports = class ClientUtil extends Base {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     */
    constructor(client) {

        super(client);

        this.client = client;
    }

    isString = CoreUtil.isString;

    REGEX_USER_MENTION    = /^<@![0-9]+>$/gi;
    REGEX_CHANNEL_MENTION = /^<#[0-9]+>$/gi;
    REGEX_URL             = CoreUtil.REGEX_URL;
    REGEX_EMOJI           = CoreUtil.REGEX_EMOJI;
    REGEX_UNICODE_EMOJI   = CoreUtil.REGEX_UNICODE_EMOJI;

    color = CoreUtil.Color;

    wait = Util.promisify(setTimeout);

    randomNumber = CoreUtil.randomNumber;
    randomInt    = CoreUtil.randomInt;
    randomValue  = CoreUtil.randomValue;

    memoize = CoreUtil.memoize;

    code      = inlineCode;
    codeBlock = codeBlock;

    emojiURL = CoreUtil.emojiURL;

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    }

    progressBar(value = 0, maxValue = 100, options = {}) {

        const { size = 20, progress = '⣿', half = '⣇', empty = '⣀', start = '', end = '', text = true, code = false, raw = false } = options;

        const percentage = Math.min(value / maxValue, 1);          // Calculate the percentage of the bar
        const current    = Math.floor((size * percentage));              // Calculate the number of progress characters to fill the progress side.
        const between    = Math.round(size * percentage) - current;    // Calculate the number of half characters (should be 0 or 1)
        let left         = Math.max(size - current - between, 0);  // Calculate the number of empty characters to fill the empty progress side.

        if (Math.floor(size * percentage) > current) {
            left--;
        }

        let result = `${ start }${ progress.repeat(current) }${ half.repeat(between) }${ empty.repeat(left) }${ end }`;

        if (text) { // Displaying the percentage of the bar

            result += `${ Math.round(percentage * 100) }%`.padStart(5, ' ');
        }

        if (raw) {

            return result;
        }

        if (code) {

            return inlineCode(result);
        }

        return codeBlock(result);
    }

    debounce(func, timeout = 300) {

        let interval;

        return (...args) => {

            clearTimeout(interval);

            interval = setTimeout(() => func(...args), timeout);
        };
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

    /**
     *
     * @param {Message|Interaction}                                                         obj
     * @param {String|MessagePayload|MessageOptions|WebhookEditMessageOptions|MessageEmbed} payload
     */
    send(obj, payload) {

        let _payload = payload;

        if (payload instanceof MessageEmbed) {

            _payload = { embeds : [payload] };
        }


        if (obj instanceof Interaction) {

            if (obj.deferred || obj.replied) {

                return obj.editReply(_payload);
            }

            return obj.reply(_payload, { fetchReply : true });
        }

        if (obj instanceof Message) {

            if (obj.util) {

                return obj.util.send(_payload);
            }

            return obj.channel.send(_payload);
        }

        throw new Error(`Could not send a message using object ${ typeof obj }`);
    }
};
