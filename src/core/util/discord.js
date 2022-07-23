'use strict';

// eslint-disable-next-line no-unused-vars
const { Snowflake, ReactionEmoji, GuildEmoji, EmbedBuilder } = require('discord.js');

const { isString } = require('./is');

module.exports = {

    /**
     * @param {String|Snowflake} guildId
     * @param {String|Snowflake} channelId
     * @param {String|Snowflake} messageId
     * @param {Message}          message
     *
     * @return {String}
     */
    linkUrl({ guildId = '@me', channelId, messageId, message }) {

        const base = `https://discordapp.com/channels`;

        if (message) {

            return [base, message.guildId || '@me', message.channelId, message.id].filter(Boolean).join('/');
        }

        return [base, guildId, channelId, messageId].filter(Boolean).join('/');
    },

    /**
     * @param {Emoji|GuildEmoji|ReactionEmoji|string} emoji
     * @param {Object}                                [options]
     *
     * @return {string}
     */
    emojiURL(emoji, options = {}) {

        if (isString(emoji)) {

            const { cdn = 'https://twemoji.maxcdn.com', v = 'latest', sep = '-', size = '72x72', ext = 'png' } = options;

            const surrogates = emoji.indexOf(String.fromCharCode(0x200D)) < 0 ? emoji.replace(/\uFE0F/g, '') : emoji;

            const r = [];

            let c = 0;
            let p = 0;
            let i = 0;

            while (i < surrogates.length) {

                c = surrogates.charCodeAt(i++);

                if (p) {
                    r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
                    p = 0;
                }
                else if (c >= 0xD800 && c <= 0xDBFF) {
                    p = c;
                }
                else {
                    r.push(c.toString(16));
                }
            }

            const code = r.join(sep);

            return [cdn, 'v', v, size, `${ code }.${ ext }`].join('/');
        }

        if (emoji.url) {

            return emoji.url;
        }

        if (isString(emoji.name)) {

            return module.exports.emojiURL(emoji.name, options);
        }

        throw new Error(`Could not get an URL out of this emoji : "${ emoji }"`);
    },

    /**
     * @param {EmbedBuilder} embed
     * @returns {string|null}
     */
    embedHexColor(embed) {

        return embed?.data?.color ? `#${ embed.data.color.toString(16).padStart(6, '0') }` : null;
    }
};
