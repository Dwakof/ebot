'use strict';

const { SnowflakeUtil, Constants } = require('discord.js');
const { channelMention }                           = require('@discordjs/builders');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

const { default : PQueue } = require('p-queue');

const Service    = require('../../../core/service');
const { Status } = require('../../../core/util');

module.exports = class SyncService extends Service {

    static FIRST_MESSAGE_ID = SnowflakeUtil.generate(SnowflakeUtil.EPOCH);

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

    /**
     * @param {Guild}   guild
     * @param {Message} message
     *
     * @return {Promise<void>}
     */
    async syncGuild(guild, message) {

        const { State } = this.client.providers('history');

        const status = new Status({ startAt : new Date(), current : 0, doing : true, done : false });

        try {

            const currentChannels = new Map();

            status.on('update', (data) => {

                return this.progressGuild(guild, data, currentChannels, message);
            });

            const { doing } = await State.get('guild_import', guild.id, { doing : false });

            if (doing) {

                return;
            }

            status.set({ current : 1, total : guild.channels.cache.size, messages : 0 });

            await State.set('guild_import', guild.id, status);

            const msg = await this.progressGuild(guild, status, currentChannels, message);

            status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });

            await State.set('guild_import', guild.id, status);

            this.client.logger.info({ message : `Started guild ${ guild.id } (${ guild.name }) import`, status });

            let interval;

            if (message) {

                interval = setInterval(() => status.update(), 1200);
            }

            const queue = new PQueue({ concurrency : 7 });

            for (const [, channel] of guild.channels.cache) {

                queue.add(async () => {

                    currentChannels.set(channel.id, channel);

                    await this.syncChannel(guild, channel, null, status);

                    status.increase('current');

                    await State.set('guild_import', guild.id, status);

                    currentChannels.delete(channel.id);
                });
            }

            await queue.onIdle();

            status.set({ done : true, doing : false });

            this.client.logger.info({
                message : `Finished guild ${ guild.id } (${ guild.name }) import with ${ status.get('messages') } messages imported`,
                status
            });

            clearInterval(interval);
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({ message : `Could not sync message for guild ${ guild.id }`, error, status });
            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('guild_import', guild.id, status);
        }
    }

    /**
     * @param {Guild}   guild
     * @param {Channel} channel
     * @param {Message} [message]
     * @param {Status}  [parentStatus]
     *
     * @return {Promise<boolean|number|*>}
     */
    async syncChannel(guild, channel, message, parentStatus) {

        const { State, History } = this.client.providers('history');

        const status = new Status({ startAt : new Date(), messages : 0, doing : true, done : false });

        if (!channel.isText()) {

            return false;
        }

        if (channel.nsfw) {

            return false;
        }

        try {

            if (message) {

                status.on('update', (data) => {

                    return this.progressChannel(guild, channel, data, message);
                });
            }

            const { doing } = await State.get('channel_import', channel.id, { doing : false });

            if (doing) {

                return false;
            }

            await State.set('channel_import', channel.id, status);

            if (message) {

                const msg = await this.progressChannel(guild, channel, status, message);

                status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });
            }

            this.client.logger.info({ message : `Started channel ${ channel.id } (${ channel.name }) import`, status });

            const { Message } = History.models;

            let interval;

            if (message) {

                interval = setInterval(() => status.update(), 1200);
            }

            for await (const messages of this.fetchAllMessages(channel)) {

                await Message.query().insert(this.toMessage(messages)).onConflict('id').merge();

                status.increase('messages', messages.length);

                await State.set('channel_import', channel.id, status);

                if (parentStatus) {

                    parentStatus.increase('messages', messages.length);
                }
            }

            status.set({ done : true, doing : false });

            await State.set('channel_import', channel.id, status);

            this.client.logger.info({
                message : `Finished channel ${ channel.id } (${ channel.name }) import with ${ status.get('messages') } messages imported`,
                status
            });

            if (message) {

                clearInterval(interval);
            }

            return status.messages;
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({ message : `Could not sync message for channel ${ channel.id }`, error });
            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('channel_import', channel.id, status);
        }
    }

    toMessage(messages = []) {

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

    progressGuild(guild, status, channels, message) {

        if (!message) {

            return;
        }

        const { messages, current, total, doing, startAt, endAt, done, failed } = status;

        const embed = this.client.util.embed();

        embed.setTitle(`Syncing guild`)
            .setAuthor(guild.name, guild.iconURL({ dynamic : false, size : 32 }))
            .setThumbnail(guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Constants.Colors.BLUE);

        if (doing && channels) {

            embed.addField('Channels', this.client.util.chunk(Array.from(channels.keys()).map(channelMention), 3).map((ids) => ids.join(' ')).flat().join('\n'), true);
        }

        if (doing) {

            embed.addField('Messages', `${ messages || 0 }`, true);
        }

        embed.addField('Progress', this.client.util.progressBar(current, total));

        if (doing) {

            embed.setFooter(`running for ${ DayJS.duration(DayJS(startAt).diff(DayJS())).humanize() }`);
        }

        if (!doing) {

            embed.setFooter(`took ${ DayJS.duration(DayJS(startAt).diff(DayJS(endAt))).humanize() }`);
        }

        if (done) {

            embed.setTitle(`Finished syncing guild ${ guild.name }`)
                .setColor(Constants.Colors.GREEN);
        }

        if (failed) {

            embed.setTitle(`Failed to sync guild ${ guild.name }`)
                .setColor(Constants.Colors.RED);
        }

        return message.util.send({ embeds : [embed] });
    }

    progressChannel(guild, channel, status, message) {

        if (!message) {

            return;
        }

        const { messages, doing, startAt, endAt, done, failed } = status;

        const embed = this.client.util.embed();

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

        return message.util.send({ embeds : [embed] });
    }
};
