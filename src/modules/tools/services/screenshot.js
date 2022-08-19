'use strict';

const Pug  = require('pug');
const Path = require('path');

const { markdownEngine : MarkdownEngine, rules, toHTML } = require('discord-markdown');

const { Invite } = require('discord.js');

const { Service } = require('../../../core');

const Pgk = require('../../../../package.json');

const UIPackage = '@skyra/discord-components-core';
const UIVersion = Pgk.dependencies[UIPackage];

module.exports = class ScreenshotService extends Service {

    #templates;
    #parser;
    #output;

    static #width = 800;

    init() {

        this.#templates = {
            message : Pug.compileFile(Path.join(__dirname, '../templates/message.pug')),
            mention : Pug.compileFile(Path.join(__dirname, '../templates/mention.pug')),
            emoji   : Pug.compileFile(Path.join(__dirname, '../templates/emoji.pug'))
        };

        const config = {
            ...rules,
            discordEmoji : {
                ...rules.discordEmoji,
                html : ({ id, animated, name }) => {

                    return this.#templates.emoji({
                        url        : `https://cdn.discordapp.com/emojis/${ id }.${ animated ? 'gif' : 'png' }?size=96`,
                        embedEmoji : false,
                        name
                    });
                }
            }
        };

        this.#parser = MarkdownEngine.parserFor(config);
        this.#output = MarkdownEngine.outputFor(config, 'html');
    }

    /**
     * @param {String} messageId
     * @param {String} channelId
     *
     * @return {Promise<Buffer>}
     */
    async screenshotMessageId(messageId, channelId) {

        const channel = await this.client.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        return this.screenshotMessage(message);
    }

    /**
     * @param {String} messageId
     * @param {String} channelId
     *
     * @return {Promise<String>}
     */
    async screenshotMessageIdAndUpload(messageId, channelId) {

        const { UploadService } = this.services('core');

        const buffer = await this.screenshotMessageId(messageId, channelId);

        return UploadService.upload(buffer, { contentType : 'image/png' });
    }

    /**
     * @param {Message} message
     *
     * @return {Promise<Buffer>}
     */
    async screenshotMessage(message) {

        const { BrowserService } = this.services('core');

        const page = await BrowserService.newPage();

        try {

            // TODO maybe change viewport size based on attachment ?

            await page.setViewport({ width : ScreenshotService.#width, height : 600, deviceScaleFactor : 2 });

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
                attachments : Array.from(message.attachments.values()).map(({ width, height, ...attachment }) => {

                    if (width > (ScreenshotService.#width * 0.8)) {

                        height = Math.round(height * (ScreenshotService.#width * 0.8) / width);
                        width  = (ScreenshotService.#width * 0.8);
                    }

                    return { ...attachment, width, height, type : 'media' };
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

            const mentions = {
                users    : {},
                roles    : {},
                channels : {}
            };

            for (const [id] of message.mentions.users) {

                const mentionedMember = await message.guild.members.fetch(id, { force : true }); // To be sure to get updated info of the member like `displayHexColor`

                mentions.users[id] = this.#templates.mention({
                    color : mentionedMember.displayHexColor,
                    type  : 'user',
                    name  : mentionedMember.nickname ?? mentionedMember.user.username
                });
            }

            mentions.roles = message.mentions.roles.reduce((acc, role, id) => {

                return { ...acc, [`${ id }`] : this.#templates.mention({ color : role.hexColor, type : 'role', name : role.name }) };

            }, {});

            mentions.channels = message.mentions.channels.reduce((acc, channel, id) => {

                if (channel.isVoice()) {

                    return { ...acc, [`${ id }`] : this.#templates.mention({ type : 'voice', name : channel.name }) };
                }

                return { ...acc, [`${ id }`] : this.#templates.mention({ type : 'channel', name : channel.name }) };

            }, {});

            data.message.content = toHTML(data.message.content, {
                discordCallback : {
                    user     : ({ id }) => mentions.users[id],
                    channel  : ({ id }) => mentions.channels[id],
                    role     : ({ id }) => mentions.roles[id],
                    everyone : () => this.#templates.mention({ type : 'user', name : 'everyone' }),
                    here     : () => this.#templates.mention({ type : 'user', name : 'here' })
                }
            }, this.#parser, this.#output);

            // TODO support Big (Jumboable) emoji (instead of 1.375em it's 3em)

            for (const [string] of data.message.content.matchAll(this.client.util.REGEX_UNICODE_EMOJI)) {

                data.message.content = data.message.content.replace(string, this.#templates.emoji({
                    url        : this.client.util.emojiURL(string),
                    name       : 'unicode-emoji', // Putting the actual emoji there could cause issues if there are multiple time the same emoji, an alternative would be the emoji name but I don't have it
                    embedEmoji : false
                }));
            }

            await page.setContent(this.#templates.message(data), { waitUntil : 'load' });

            await BrowserService.smartWait(page);

            await page.waitForNetworkIdle();

            // Screenshotting the element itself was not working

            const element = await page.$('#messages');

            return await page.screenshot({ type : 'png', clip : await element.boundingBox() });
        }
        finally {

            await page.close();
        }
    }

    /**
     * @param {Message} message
     *
     * @return {Promise<String>}
     */
    async screenshotMessageAndUpload(message) {

        const { UploadService } = this.services('core');

        const buffer = await this.screenshotMessage(message);

        return UploadService.upload(buffer, { contentType : 'image/png' });
    }
};
