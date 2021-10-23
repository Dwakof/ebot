'use strict';

const Puppeteer = require('puppeteer');
const Pug       = require('pug');
const Path      = require('path');

const { Invite } = require('discord.js');

const Hoek = require('@hapi/hoek');

const { Service } = require('../../../core');

module.exports = class ScreenshotService extends Service {

    #browser;
    #template;

    async init() {

        this.#browser = await Puppeteer.launch({
            args     : ['--no-sandbox', '--disable-setuid-sandbox'],
            headless : false
        });

        this.#template = Pug.compileFile(Path.join(__dirname, '../templates/content.pug'));
    }

    /**
     * @param {Message} message
     * @return {Promise<void>}
     */
    async screenshotMessage(message) {

        const page = await this.#browser.newPage();

        try {

            page.once('load', () => console.info('✅ Page is loaded'));
            page.once('close', () => console.info('✅ Page is closed'));

            await this.client.channels.cache.get(message.channelId).messages.fetch(message.id, { force : true });

            console.log(message);

            const member = await this.client.guilds.cache.get(message.guildId).members.fetch(message.author.id, { force : true });

            const data = {};

            const timestamp = new Date(message.createdTimestamp);

            data.message = {
                content     : message.content,
                timestamp   : `${ timestamp.getUTCMonth() + 1 }/${ timestamp.getUTCDate() }/${ timestamp.getUTCFullYear() }`,
                edited      : !!message.editedTimestamp,
                author      : {
                    name   : member.nickname ?? member.user.username,
                    avatar : member.user.avatarURL({ dynamic : true, size : 64 }),
                    color  : member.displayHexColor,
                    bot    : member.user.bot
                },
                attachments : Array.from(message.attachments.values()).map((attachment) => {

                    return { ...attachment, type : 'media' };
                }),
                reactions   : Array.from(message.reactions.cache.values()).map((reaction) => {

                    return {
                        name  : reaction.emoji.name,
                        emoji : this.client.util.emojiURL(reaction.emoji),
                        count : reaction.count
                    };
                })
            };

            if (message.content) {

                const invites = [...message.content.matchAll(Invite.INVITES_PATTERN)];

                for (const [url] of invites) {

                    const invite = await this.client.fetchInvite(url);

                    data.message.attachments.push({
                        name      : invite.guild.name,
                        icon      : invite.guild.iconURL({ dynamic : true, size : 128 }),
                        online    : invite.presenceCount,
                        members   : invite.memberCount,
                        partnered : invite.guild.partnered,
                        verified  : invite.guild.verified,
                        type      : 'invite'
                    });
                }
            }

            console.log(data.message);

            await page.setContent(this.#template(data), { waitUntil : 'load' });

            await Hoek.wait(300000);
        }
        finally {

            page.close();
        }
    }
};
