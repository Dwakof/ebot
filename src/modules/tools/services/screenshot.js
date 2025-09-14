'use strict';

const Pug  = require('pug');
const Path = require('path');

const { markdownEngine : MarkdownEngine, rules, toHTML } = require('discord-markdown');

const { Invite, ChannelType, FormattingPatterns } = require('discord.js');

const { DateTime } = require('luxon');

const { Service, Util } = require('../../../core');

const Pgk = require('../../../../package.json');

const UIPackage = '@skyra/discord-components-core';
const UIVersion = Pgk.dependencies[UIPackage];

module.exports = class ScreenshotService extends Service {

    static #width = 800;

    static TimestampRegex    = new RegExp(`^${ FormattingPatterns.Timestamp.source }`, FormattingPatterns.Timestamp.flags);
    static EmojiUnicodeRegex = new RegExp(`^${ Util.REGEX_UNICODE_EMOJI.source }`, Util.REGEX_UNICODE_EMOJI.flags);

    #templates;
    #parser;
    #output;

    init() {

        this.#templates = {
            message   : Pug.compileFile(Path.join(__dirname, '../templates/message.pug'), null),
            mention   : Pug.compileFile(Path.join(__dirname, '../templates/mention.pug'), null),
            emoji     : Pug.compileFile(Path.join(__dirname, '../templates/emoji.pug'), null),
            timestamp : Pug.compileFile(Path.join(__dirname, '../templates/timestamp.pug'), null)
        };

        const config = {
            ...rules,
            timestamp    : {
                order : rules.strong.order,
                match : (source) => ScreenshotService.TimestampRegex.exec(source),
                parse : ({ groups }) => groups,
                html  : ({ timestamp }) => {

                    return this.#templates.timestamp({ time : DateTime.fromMillis(parseInt(timestamp, 10) * Util.SECOND).toRelativeCalendar() });
                }
            },
            unicodeEmoji : {
                order : rules.text.order,
                match : (source) => ScreenshotService.EmojiUnicodeRegex.exec(source),
                parse : ([unicode]) => ({ unicode }),
                html  : ({ unicode }) => {

                    return this.#templates.emoji({
                        url        : this.client.util.emojiURL(unicode),
                        name       : 'unicode-emoji',
                        embedEmoji : false
                    });
                }
            },
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

    discordStringToHTML(string, options = {}) {

        return toHTML(string, options, this.#parser, this.#output);
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

            await page.setViewport({ width : ScreenshotService.#width, height : 600, deviceScaleFactor : 2 });

            await page.addScriptTag({ url : `https://unpkg.com/${ UIPackage }@${ UIVersion }`, type : 'module' });

            await this.client.channels.cache.get(message.channelId).messages.fetch(message.id, { force : true });

            const member = await message.guild.members.fetch({ user : message.author.id, force : true });

            const data = {};

            const timestamp = new Date(message.createdTimestamp);

            data.message = {
                content     : message.content,
                timestamp   : `${ timestamp.getUTCMonth() + 1 }/${ timestamp.getUTCDate() }/${ timestamp.getUTCFullYear() }`,
                edited      : !!message.editedTimestamp,
                author      : {
                    name   : member.nickname ?? member.user.username,
                    avatar : member.user.avatarURL({ forceStatic : true, extension : 'webp', size : 64 }),
                    color  : member.displayHexColor,
                    bot    : member.user.bot
                },
                embeds      : [],
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

                const invites = [...message.content.matchAll(new RegExp(Invite.InvitesPattern.source, 'gi'))];

                for (const [url] of invites) {

                    try {

                        const invite = await this.client.fetchInvite(url);

                        data.message.attachments.push({
                            name      : invite.guild.name,
                            icon      : invite.guild.iconURL({ forceStatic : false, extension : 'webp', size : 128 }),
                            online    : invite.presenceCount,
                            members   : invite.memberCount,
                            partnered : invite.guild.partnered,
                            verified  : invite.guild.verified,
                            type      : 'invite'
                        });
                    }
                    // eslint-disable-next-line no-unused-vars
                    catch (error) {

                        // This invite link might be expired or invalid, idk what to do other than nothing
                    }
                }
            }

            const mentions = {
                users    : new Map(),
                roles    : new Map(),
                channels : new Map(),
                messages : new Map()  // TODO discord added a message mention feature, maybe add it ? But would need discord-components support.
            };

            for (const [id] of message.mentions.users) {

                const mentionedMember = await message.guild.members.fetch({ user : id, force : true }); // To be sure to get updated info of the member like `displayHexColor`

                mentions.users.set(String(id), this.#templates.mention({
                    color : mentionedMember.displayHexColor,
                    name  : mentionedMember.nickname ?? mentionedMember.user.username,
                    type  : 'user'
                }));
            }

            for (const [id, role] of message.mentions.roles) {

                mentions.roles.set(String(id), this.#templates.mention({ color : role.hexColor, type : 'role', name : role.name }));
            }

            for (const [id, channel] of message.mentions.channels) {

                let type = 'channel';

                switch (channel.type) {
                    case ChannelType.GuildVoice:
                        type = 'voice';
                        break;
                    case ChannelType.GuildForum:
                        type = 'forum';
                        break;
                    case ChannelType.PrivateThread:
                    case ChannelType.PublicThread:
                        type = 'thread';
                        break;
                }

                if (channel.locked) {

                    type = 'locked';
                }

                mentions.channels.set(String(id), this.#templates.mention({ type, name : channel.name }));
            }

            // TODO need to parse embeds data for mentions too 🤦

            const parserOptions = {
                discordCallback : {
                    user     : ({ id }) => mentions.users.get(id),
                    channel  : ({ id }) => mentions.channels.get(id),
                    role     : ({ id }) => mentions.roles.get(id),
                    everyone : () => this.#templates.mention({ type : 'user', name : 'everyone' }),
                    here     : () => this.#templates.mention({ type : 'user', name : 'here' })
                }
            };

            data.message.content = this.discordStringToHTML(data.message.content, parserOptions);

            for (const embed of message.embeds) {

                const raw = embed.toJSON();

                raw.footer    = raw.footer ?? {};
                raw.image     = raw.image ?? {};
                raw.thumbnail = raw.thumbnail ?? {};
                raw.video     = raw.video ?? {};
                raw.provider  = raw.provider ?? {};
                raw.author    = raw.author ?? {};
                raw.fields    = raw.fields ?? [];

                if (raw.color !== undefined) {

                    // noinspection JSValidateTypes
                    raw.color = embed.hexColor;
                }

                for (const [idx, field] of raw.fields.entries()) {

                    field.value = this.discordStringToHTML(field.value, parserOptions);
                    field.index = !raw.fields[idx - 1]?.inline || raw.fields[idx - 1]?.index === 3 ? 1 : raw.fields[idx - 1].index + 1;
                }

                data.message.embeds.push(raw);
            }

            await page.setContent(this.#templates.message(data), { waitUntil : 'load' });

            await BrowserService.smartWait(page);

            await page.waitForNetworkIdle();

            // Screenshotting the element itself was not working

            const element = await page.$('#messages');

            return Buffer.from(await page.screenshot({ type : 'png', clip : await element.boundingBox() }));
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
