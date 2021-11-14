'use strict';

const Puppeteer = require('puppeteer');
const Pug       = require('pug');
const Path      = require('path');

const { Invite, MessageMentions } = require('discord.js');

const Hoek = require('@hapi/hoek');

const { Service } = require('../../../core');

const Pgk = require('../../../../package.json');

const UIPackage = '@skyra/discord-components-core';
const UIVersion = Pgk.dependencies[UIPackage];

module.exports = class ScreenshotService extends Service {

    #browser;
    #templates;

    async init() {

        // TODO mode Puppeteer in his own service so that you can only require page

        this.#browser = await Puppeteer.launch({ args : ['--no-sandbox', '--disable-setuid-sandbox'], headless : true });

        this.#templates = {
            message : Pug.compileFile(Path.join(__dirname, '../templates/message.pug')),
            mention : Pug.compileFile(Path.join(__dirname, '../templates/mention.pug')),
            emoji   : Pug.compileFile(Path.join(__dirname, '../templates/emoji.pug'))
        };
    }

    /**
     * @param {Message} message
     * @return {Promise<Buffer>}
     */
    async screenshotMessage(message) {

        const page = await this.#browser.newPage();

        try {

            // TODO wire log to client.logger

            // page.on('console', (...args) => console.log(...args));
            // page.on('error', (...args) => console.error(...args));
            // page.on('pageerror', (...args) => console.error(...args));

            // TODO maybe change viewport size based on attachment ?

            await page.setViewport({ width : 600, height : 600, deviceScaleFactor : 2 });

            await page.addScriptTag({ url : `https://unpkg.com/${ UIPackage }@${ UIVersion }`, type : 'module' });

            await this.client.channels.cache.get(message.channelId).messages.fetch(message.id, { force : true });

            const member = await message.guild.members.fetch(message.author.id, { force : true });

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
                embeds      : Array.from(message.embeds).map((embed) => {

                    // TODO replace emoji with a component in every field

                    // TODO Maybe check how Discord handle embed in his own client

                    embed.author = embed.author || {};
                    embed.image  = embed.image || {};

                    if (embed.provider && !embed.author.name) {

                        embed.author.name = embed.provider.name;
                    }

                    if (embed.thumbnail && !embed.image.url) {

                        embed.image.url = embed.thumbnail.url;
                    }

                    return embed;
                }),
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

                    try {

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
                    catch (error) {

                        // This invite link might be expired or invalid, idk what to do other than nothing
                    }
                }
            }

            data.message.content = data.message.content.replace(this.client.util.REGEX_URL, (url) => `<a>${ url }</a>`);

            data.message.content = data.message.content.replace(/```([a-z]*\n?[\s\S]*?\n?)```/g, (code) => {

                // TODO named code blocks

                return `<pre><code>${ code.replace(/`/g, '') }</code></pre>`;
            });

            data.message.content = data.message.content.replace(/`([a-z]*\n?[\s\S]*?\n?)`/g, (code) => {

                return `<code class="inline">${ code.replace(/`/g, '') }</code>`;
            });

            data.message.content = data.message.content.replace(/\r?\n|\r/g, '</br>');

            // TODO Italic
            // TODO Bold

            // Replace emoji

            // TODO support Big (Jumboable) emoji (instead of 1.375em it's 3em)

            for (const [string] of data.message.content.matchAll(this.client.util.REGEX_UNICODE_EMOJI)) {

                data.message.content = data.message.content.replace(string, this.#templates.emoji({
                    url        : this.client.util.emojiURL(string),
                    name       : 'unicode-emoji', // Putting the actual emoji there could cause issues if there are multiple time the same emoji, an alternative would be the emoji name but I don't have it
                    embedEmoji : false
                }));
            }

            for (const [string, animated, name, id] of data.message.content.matchAll(this.client.util.REGEX_EMOJI)) {

                let url = `https://cdn.discordapp.com/emojis/${ id }.png?size=96`;

                if (!!animated) {

                    url = `https://cdn.discordapp.com/emojis/${ id }.gif?size=96`;
                }

                data.message.content = data.message.content.replace(string, this.#templates.emoji({ url, name, embedEmoji : false }));
            }

            // Replace mention with mention-component

            for (const [id] of message.mentions.users) {

                const regex           = new RegExp(`<@?\!${id}>`);
                const mentionedMember = await message.guild.members.fetch(id, { force : true }); // To be sure to get updated info of the member like `displayHexColor`
                const string          = this.#templates.mention({
                    color : mentionedMember.displayHexColor,
                    type  : 'user',
                    name  : mentionedMember.nickname ?? mentionedMember.user.username
                });

                data.message.content = data.message.content.replace(regex, string);
            }

            for (const [id, role] of message.mentions.roles) {

                const regex  = new RegExp(`<@?\&${id}>`);
                const string = this.#templates.mention({ color : role.hexColor, type : 'role', name : role.name });

                data.message.content = data.message.content.replace(regex, string);
            }

            for (const [id, channel] of message.mentions.channels) {

                const regex = new RegExp(`<@?#${id}>`);

                let string = this.#templates.mention({ type : 'channel', name : channel.name });

                if (channel.isVoice()) {

                    string = this.#templates.mention({ type : 'voice', name : channel.name });
                }

                data.message.content = data.message.content.replace(regex, string);
            }

            data.message.content = data.message.content.replace(MessageMentions.EVERYONE_PATTERN, (mention) => {

                return this.#templates.mention({ type : 'user', name : mention.slice(1) });
            });

            await page.setContent(this.#templates.message(data), { waitUntil : 'load' });

            // Smart load algorithm,
            // checking the size of the html content to wait for JS Frontend to finish rendering and waiting for image to load

            let check         = 0;
            let done          = false;
            let contentLength = (await page.content()).length;

            setTimeout(() => (done = true), 5000);

            do {

                await Hoek.wait(250);

                const newContentLength = (await page.content()).length;

                if (newContentLength === contentLength) {

                    check++;
                }
                else {

                    check         = 0;
                    contentLength = newContentLength;
                }

            } while (check < 3 && !done);

            await page.waitForNetworkIdle();

            // Screenshotting the element itself was not working

            const element = await page.$('#messages');

            return await page.screenshot({ type : 'png', clip : await element.boundingBox() });
        }
        finally {

            await page.close();
        }
    }
};
