'use strict';

const { SnowflakeUtil, Constants, Permissions } = require('discord.js');
const { channelMention }                        = require('@discordjs/builders');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

const { default : PQueue } = require('p-queue');

const { Service, Util } = require('../../../core');

module.exports = class SyncService extends Service {

    static FIRST_MESSAGE_ID = SnowflakeUtil.generate(SnowflakeUtil.EPOCH);
    static CHANNEL_STATE    = 'channel_import';
    static GUILD_STATE      = 'guild_import';
    static REQUIRED_PERMS   = [Permissions.FLAGS.READ_MESSAGE_HISTORY, Permissions.FLAGS.VIEW_CHANNEL];

    async * fetchAllMessages(channel, limit = 100) {

        let after = SyncService.FIRST_MESSAGE_ID;

        let messages;

        while (after) {

            messages = await channel.messages.fetch({ after, limit });

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

        const { State, History } = this.client.providers('history');

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

                const { Message } = History.models;

                for await (const messages of this.fetchAllMessages(channel)) {

                    await Message.query().insert(SyncService.toMessage(messages)).onConflict('id').merge();

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

        const { State } = this.client.providers('history');

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

                const queue = new PQueue({ concurrency : 7 });

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
            .setAuthor(guild.name, guild.iconURL({ dynamic : false, size : 32 }))
            .setThumbnail(guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Constants.Colors.BLUE);

        if (doing && channels) {

            embed.addField('Channels', this.client.util.chunk(Array.from(channels).map(channelMention), 3).map((ids) => ids.join(' ')).flat().join('\n'), true);
        }

        if (doing) {

            embed.addField('Messages', `${ messages }`, true);
        }

        if (doing && current) {

            embed.addField('Progress', this.client.util.progressBar(current, total));
        }

        if (doing) {

            embed.setFooter(`Running for ${ DayJS.duration(DayJS(startAt).diff(DayJS())).humanize() }`);
        }

        if (!doing) {

            embed.setFooter(`Took ${ DayJS.duration(DayJS(startAt).diff(DayJS(endAt))).humanize() }`);
        }

        if (done) {

            embed.setTitle(`Finished syncing guild ${ guild.name }`)
                .setColor(Constants.Colors.GREEN);
        }

        if (failed) {

            embed.setTitle(`Failed to sync guild ${ guild.name }`)
                .setColor(Constants.Colors.RED);
        }

        return embed;
    }

    progressChannel(guildId, channelId, task) {

        const { messages, doing, startAt, endAt, done, failed } = task.getAll();

        const embed = this.client.util.embed();

        const guild   = this.client.guilds.cache.get(guildId);
        const channel = guild.channels.cache.get(channelId);

        embed.setTitle(`Syncing channel ${ channel.name }`)
            .setAuthor(guild.name, guild.iconURL({ dynamic : false, size : 32 }))
            .setThumbnail(channel.guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Constants.Colors.BLUE);

        embed.setDescription(`${ messages || 0 } messages`);

        if (doing) {

            embed.setFooter(`running for ${ DayJS.duration(DayJS(startAt).diff(DayJS())).humanize() }`);
        }

        if (!doing) {

            embed.setFooter(`took ${ DayJS.duration(DayJS(startAt).diff(DayJS(endAt))).humanize() }`);
        }

        if (done) {

            embed.setTitle(`Finished syncing channel ${ channel.name }`)
                .setColor(Constants.Colors.GREEN);
        }

        if (failed) {

            embed.setTitle(`Failed to sync channel ${ channel.name }`)
                .setColor(Constants.Colors.RED);
        }

        return embed;
    }

    static toMessage(messages = []) {

        return messages.map((message) => {

            return {
                id        : message.id,
                guildId   : message.guild.id,
                authorId  : message.author.id,
                content   : message.content || '',
                createdAt : message.createdAt,
                updatedAt : message.editedAt || message.createdAt
            };
        });
    }

    static filterChannel(channel) {

        if (!channel.guild) {

            return false;
        }

        if (!channel.isText()) {

            return false;
        }

        if (channel.nsfw) {

            return false;
        }

        return channel.guild.me.permissionsIn(channel).has(SyncService.REQUIRED_PERMS);
    }
};
