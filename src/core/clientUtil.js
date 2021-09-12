'use strict';

const { ClientUtil : Base } = require('discord-akairo');

const Hoek = require('@hapi/hoek');
const Util = require('util');

// eslint-disable-next-line no-unused-vars
const { Embed, MessageActionRow, MessageButton, Constants } = require('discord.js');
const { memberNicknameMention, blockQuote, inlineCode }     = require('@discordjs/builders');

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

    wait = Util.promisify(setTimeout);

    randomNumber = CoreUtil.randomNumber;
    randomInt    = CoreUtil.randomInt;
    randomValue  = CoreUtil.randomValue;

    memoize = CoreUtil.memoize;

    code      = inlineCode;
    codeBlock = blockQuote;

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
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
     * @param {Message}               originalMessage
     * @param {Array<Embed|Function>} pages
     * @param {Object}                [options]
     */
    async replyPaginatedEmbeds(originalMessage, pages, options = {}) {

        const { timeout, buttons, footerBuilder } = Hoek.applyToDefaults({
            timeout       : 120000,
            footerBuilder : (page, index, total) => `Page ${ index + 1 } / ${ total }`,
            buttons       : {
                previous : {
                    customId : 'previous',
                    label    : 'Previous',
                    style    : Constants.MessageButtonStyles.SECONDARY,
                    disabled : true
                },
                next     : {
                    customId : 'next',
                    label    : 'Next',
                    style    : Constants.MessageButtonStyles.SECONDARY
                }
            }
        }, options);

        let index = 0;

        const previous = new MessageButton(buttons.previous);
        const next     = new MessageButton(buttons.next);

        const filter = (interaction) => [previous.customId, next.customId].includes(interaction.customId);

        const getPage = async (i) => {

            let embed = pages[i];

            if (embed instanceof Promise) {

                embed = await embed;
            }

            if (typeof embed === 'function') {

                embed = await embed(i);
            }

            if (footerBuilder) {

                embed.setFooter(footerBuilder(embed, i, pages.length));
            }

            return { embeds : [embed], components : [new MessageActionRow({ components : [previous, next] })] };
        };

        const reply = await originalMessage.reply(await getPage(index));

        const collector = await reply.createMessageComponentCollector({ filter, time : timeout });

        collector.on('collect', async (interaction) => {

            previous.setDisabled(false);
            next.setDisabled(false);

            switch (interaction.customId) {
                case previous.customId :
                    index = Math.max(0, index - 1);
                    break;
                case next.customId :
                    index = Math.min(pages.length - 1, index + 1);
                    break;
                default:
                    return;
            }

            if (index === 0) {

                previous.setDisabled(true);
            }

            if (index === pages.length - 1) {

                next.setDisabled(true);
            }

            await interaction.deferUpdate();
            await reply.edit(await getPage(index));
            return collector.resetTimer();
        });

        collector.on('end', async () => {

            previous.setDisabled(true);
            next.setDisabled(true);
            return reply.edit(await getPage(index));
        });

        return reply;
    }
};
