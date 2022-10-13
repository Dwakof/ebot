'use strict';

const { SnowflakeUtil, Colors, PermissionsBitField, ChannelType } = require('discord.js');
const { channelMention }                                          = require('discord.js');

const { DateTime } = require('luxon');

const { Service, Util } = require('../../../core');

module.exports = class SyncService extends Service {

    #PQueue;

    static FIRST_MESSAGE_ID = SnowflakeUtil.epoch;
    static CHANNEL_STATE    = 'channel_import';
    static GUILD_STATE      = 'guild_import';
    static REQUIRED_PERMS   = [PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ViewChannel];

    async init() {

        // eslint-disable-next-line node/no-unsupported-features/es-syntax,node/no-missing-import
        this.#PQueue = await import('p-queue');
    }

    async * fetchAllMessages(channel, limit = 100) {

        let after = SyncService.FIRST_MESSAGE_ID;

        let messages;

        while (after) {

            messages = await channel.messages.fetch({ after, limit, cache : false });

            const timeout = this.client.util.wait(900);

            if (messages.size > 0) {

                yield Array.from(messages.values());
            }

            after = (Array.from(messages.keys()) || []).sort().pop();

            if (after) {

                await timeout;
            }
        }
    }

    syncChannel(guildId, channelId) {

        const { State, History } = this.providers();

        const stateKey = `${ guildId }_${ channelId }`;

        return new Util.Task(async (task) => {

            try {

                task.set({ guildId, channelId, messages : 0 });

                const { doing } = await State.get(SyncService.CHANNEL_STATE, stateKey, { doing : false });

                if (doing) {

                    return false;
                }

                await State.set(SyncService.CHANNEL_STATE, stateKey, task);

                const channel = this.client.channels.cache.get(channelId);

                if (!SyncService.filterChannel(channel)) {

                    return false;
                }

                const { Message, Emoji } = History.models;

                for await (const messages of this.fetchAllMessages(channel)) {

                    await Message.query().insert(this.toMessage(messages)).onConflict('id').merge();

                    for (const message of messages) {

                        await Emoji.query().where({ messageId : message.id }).delete();

                        const emojis = await this.toEmoji(message);

                        if (emojis.length > 0) {

                            await Emoji.query().insert(emojis).onConflict(Emoji.idColumn).ignore();
                        }
                    }

                    task.increase('messages', messages.length);

                    await State.set(SyncService.CHANNEL_STATE, stateKey, task);
                }

                task.done();
            }
            catch (err) {

                task.failed(err);

                this.client.logger.error(err, `Could not sync message for channel ${ channelId }`);
            }
            finally {

                task.enforceStop();

                await State.set(SyncService.CHANNEL_STATE, stateKey, task);
            }
        });
    }

    syncGuild(guildId) {

        const { State } = this.providers();

        const stateKey = guildId;

        return new Util.Task(async (task) => {

            try {

                task.set({ guildId, messages : 0, current : 0, total : 0, channels : new Set() });

                const { doing } = await State.get(SyncService.GUILD_STATE, stateKey, { doing : false });

                if (doing) {

                    return false;
                }

                await State.set(SyncService.GUILD_STATE, stateKey, task);

                const guild    = this.client.guilds.cache.get(guildId);
                const channels = Array.from(guild.channels.cache.values()).filter(SyncService.filterChannel);

                task.set({ total : channels.length });

                const queue = new this.#PQueue({ concurrency : 7 });

                for (const channel of channels) {

                    queue.add(async () => {

                        task.get('channels').add(channel.id);

                        const channelTask = this.syncChannel(guildId, channel.id);

                        channelTask.on('update', (t, values, previous) => {

                            if (values.messages) {

                                task.increase('messages', values.messages - previous.messages);
                            }
                        });

                        await channelTask;

                        task.increase('current');

                        task.get('channels').delete(channel.id);

                        await State.set(SyncService.GUILD_STATE, guild.id, task);
                    });
                }

                await queue.onIdle();

                task.done();
            }
            catch (err) {

                task.failed(err);

                this.client.logger.error(err, `Could not sync message for guild ${ guildId }`);
            }
            finally {

                task.enforceStop();

                await State.set(SyncService.GUILD_STATE, stateKey, task);
            }
        });
    }

    async syncGuildFromMessage(guildId, interaction) {

        let task = new Util.Task();
        let message;

        const send = () => {

            const payload = { embeds : [this.progressGuild(guildId, task)] };

            if (message) {

                return message.edit(payload);
            }

            return this.client.util.send(interaction, payload);
        };

        const interval = setInterval(() => send(), 1500);

        try {

            task = this.syncGuild(guildId);

            message = await send();

            task.set({ url : Util.linkUrl({ message }) });

            await task;

            return task.getAll();
        }
        catch (err) {

            this.client.logger.error({ msg : `Could not sync guild ${ guildId }`, err });
        }
        finally {

            clearInterval(interval);

            await send();
        }
    }

    async syncChannelFromMessage(guildId, channelId, interaction) {

        let message;
        let task = new Util.Task();

        const send = () => {

            const payload = { embeds : [this.progressChannel(guildId, channelId, task)] };

            if (message) {

                return message.edit(payload);
            }

            return this.client.util.send(interaction, payload);
        };

        const interval = setInterval(() => send(), 1500);

        try {

            task = this.syncChannel(guildId, channelId);

            message = await send();

            task.set({ url : Util.linkUrl({ message }) });

            await task;

            return task.getAll();
        }
        catch (err) {

            this.client.logger.error({ msg : `Could not sync channel ${ channelId }`, err });
        }
        finally {

            clearInterval(interval);

            await send();
        }
    }

    progressGuild(guildId, task) {

        const { messages, current, total, channels, doing, startAt, endAt, done, failed } = task.getAll();

        const embed = this.client.util.embed();

        const guild = this.client.guilds.cache.get(guildId);

        embed.setTitle(`Syncing guild`)
            .setAuthor({ name : guild.name, iconURL : guild.iconURL({ dynamic : false, size : 32 }) })
            .setThumbnail(guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Colors.Blue);

        if (doing && channels) {

            embed.addFields([
                {
                    name   : 'Channels',
                    value  : this.client.util.chunk(Array.from(channels).map(channelMention), 3).map((ids) => ids.join(' ')).flat().join('\n'),
                    inline : true
                }
            ]);
        }

        if (doing) {

            embed.addFields([{ name : 'Messages', value : `${ messages }`, inline : true }]);
        }

        if (doing && current) {

            embed.addFields([{ name : 'Progress', value : this.client.util.progressBar(current, total), inline : false }]);
        }

        if (startAt) {

            embed.setFooter({ text : `Running for ${ new DateTime(startAt).toRelative() }` });
        }

        if (startAt && !doing) {

            embed.setFooter({ text : `Took ${ new DateTime(startAt).diff(new DateTime(endAt)).toHuman() }` });
        }

        if (done) {

            embed.setTitle(`Finished syncing guild ${ guild.name }`)
                .setColor(Colors.Green);
        }

        if (failed) {

            embed.setTitle(`Failed to sync guild ${ guild.name }`)
                .setColor(Colors.Red);
        }

        return embed;
    }

    progressChannel(guildId, channelId, task) {

        const { messages, doing, startAt, endAt, done, failed } = task.getAll();

        const embed = this.client.util.embed();

        const guild   = this.client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);

        embed.setTitle(`Syncing channel ${ channel.name }`)
            .setAuthor({ name : guild.name, iconURL : guild.iconURL({ dynamic : false, size : 32 }) })
            .setThumbnail(channel.guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Colors.Blue);

        embed.setDescription(`${ messages || 0 } messages`);

        if (startAt) {

            embed.setFooter({ text : `Running for ${ new DateTime(startAt).toRelative() }` });
        }

        if (startAt && !doing) {

            embed.setFooter({ text : `Took ${ new DateTime(startAt).diff(new DateTime(endAt)).toHuman() }` });
        }

        if (done) {

            embed.setTitle(`Finished syncing channel ${ channel.name }`)
                .setColor(Colors.Green);
        }

        if (failed) {

            embed.setTitle(`Failed to sync channel ${ channel.name }`)
                .setColor(Colors.Red);
        }

        return embed;
    }

    toMessage(messages = []) {

        return messages.map((message) => {

            return {
                id        : message?.id,
                guildId   : message?.guild?.id || message?.guildId,
                authorId  : message?.author?.id,
                channelId : message?.channel?.id || message?.channelId,
                content   : message?.content,
                createdAt : message?.createdAt,
                updatedAt : message?.editedAt || message?.createdAt
            };
        });
    }

    /**
     *
     * @param {Message} message
     */
    async toEmoji(message) {

        const emojis = [];

        const base = {
            guildId   : message.guild.id,
            channelId : message.channel.id,
            authorId  : message.author.id,
            messageId : message.id,
            createdAt : message.createdAt,
            updatedAt : message.editedAt || message.createdAt
        };

        if ((message?.reactions?.cache?.size ?? 0) > 0) {

            for (const reaction of message.reactions.cache.values()) {

                const emoji = { ...base, type : 'reaction', name : reaction.emoji.name, emoji : reaction.emoji.name, unicode : true, index : 0 };

                if (reaction.emoji.identifier.indexOf(':') !== -1) {

                    emoji.emoji   = reaction.emoji.identifier.indexOf('a:') === 0 ? reaction.emoji.identifier : `:${ reaction.emoji.identifier }`;
                    emoji.unicode = false;
                }

                const users = await reaction.users.fetch();

                for (const [id] of users) {

                    emojis.push({ ...emoji, authorId : id });
                }
            }
        }

        const cache = {};

        for (const [string, , name] of message.content.matchAll(this.client.util.REGEX_EMOJI)) {

            emojis.push({ ...base, type : 'message', emoji : string.slice(1, -1), name, unicode : false, index : cache[string] || 0 });

            cache[string] = (cache[string] || 0) + 1;
        }

        for (const [string] of message.content.matchAll(this.client.util.REGEX_UNICODE_EMOJI)) {

            emojis.push({ ...base, type : 'message', emoji : string, name : string, unicode : true, index : cache[string] || 0 });

            cache[string] = (cache[string] || 0) + 1;
        }

        return emojis;
    }

    static filterChannel(channel) {

        if (!channel.guild) {

            return false;
        }

        if (channel.type !== ChannelType.GuildText) {

            return false;
        }

        if (channel.nsfw) {

            return false;
        }

        return channel.guild.members.me.permissionsIn(channel).has(SyncService.REQUIRED_PERMS);
    }
};
