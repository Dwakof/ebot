'use strict';

const { EventEmitter } = require('events');

const { SnowflakeUtil, Constants } = require('discord.js');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

const Service = require('../../../core/service');

module.exports = class SyncService extends Service {

    static FIRST_MESSAGE_ID = SnowflakeUtil.generate(SnowflakeUtil.EPOCH)

    async * fetchAllMessages(channel, limit = 100) {

        let after = SyncService.FIRST_MESSAGE_ID;

        let messages;

        while (after) {

            messages = await channel.messages.fetch({ after, limit });

            if (messages.size > 0) {

                yield Array.from(messages.values());
            }

            after = (Array.from(messages.keys()) || []).sort().pop();
        }
    }

    async syncGuild(guildId, message) {

        const { State } = this.client.providers('history');

        let guild;

        const status = new Status({ startAt : new Date(), current : 0, doing : true, done : false });

        status.on('update', (data) => {

            return this.progressGuild(guild, data, message);
        });

        try {

            const { doing } = await State.get('guild_import', guildId, { doing : false });

            if (doing) {

                return;
            }

            guild = await this.client.guilds.fetch(guildId);

            status.set({ current : 1, total : guild.channels.cache.size, messages : 0 });

            await State.set('guild_import', guildId, status);

            const msg = await this.progressGuild(guild, status, message);

            status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });

            await State.set('guild_import', guildId, status);

            this.client.logger.info({ message : `Started guild ${ guildId } (${ guild.name }) import`, status });

            for (const [channelId, channel] of guild.channels.cache) {

                if (channel.isText()) {

                    await this.syncChannel(channelId, null, status);
                }

                status.increase('current');

                await State.set('guild_import', guildId, status);

                status.update();
            }

            status.set({ done : true, doing : false });

            this.client.logger.info({
                message : `Finished guild ${ guildId } (${ guild.name }) import with ${ status.messages } messages imported`,
                status
            });
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({ message : `Could not sync message for guild ${ guildId }`, error, status });
            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('guild_import', guildId, status);
        }
    }

    async syncChannel(channelId, message, parentStatus) {

        const { State, History } = this.client.providers('history');

        let channel;

        const status = new Status({ startAt : new Date(), messages : 0, doing : true, done : false });

        if (!parentStatus) {

            status.on('update', (data) => {

                return this.progressChannel(channel, data, message);
            });
        }

        try {

            const { doing } = await State.get('channel_import', channelId, { doing : false });

            if (doing) {

                return false;
            }

            channel = await this.client.channels.fetch(channelId);

            await State.set('channel_import', channelId, status);

            if (message) {

                const msg = await this.progressChannel(channel, status, message);

                status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });
            }

            this.client.logger.info({ message : `Started channel ${ channelId } (${ channel.name }) import`, status });

            const { Message } = History.models;

            for await (const messages of this.fetchAllMessages( channel)) {

                await Message.query().insert(this.toMessage(messages)).onConflict('id').merge();

                status.increase('messages', messages.length);

                await State.set('channel_import', channelId, status);

                if (parentStatus) {

                    parentStatus.increase('messages', messages.length);

                    parentStatus.update();
                }

                status.update();

                await this.client.util.wait(750);
            }

            status.set({ done  : true, doing : false });

            await State.set('channel_import', channelId, status);

            this.client.logger.info({
                message : `Finished channel ${ channelId } (${ channel.name }) import with ${ status.messages } messages imported`,
                status
            });

            return status.messages;
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({ message : `Could not sync message for channel ${ channelId }`, error });
            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt  : new Date() });

            status.update();

            await State.set('channel_import', channelId, status);
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

    progressGuild(guild, status, message) {

        if (message && guild && status) {

            const { messages, current, total, doing, startAt, endAt, done, failed } = status;

            const embed = this.client.util.embed();

            embed.setTitle(`Syncing guild ${ guild.name }`)
                .setThumbnail(guild.iconURL({ dynamic : true, size : 256 }))
                .setTimestamp()
                .setColor(Constants.Colors.BLUE);

            embed.setDescription(`${ messages || 0 } messages across ${ current || 0 } channels`);

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
    }

    progressChannel(channel, status, message) {

        if (message && channel && status) {

            const { messages, doing, startAt, endAt, done, failed } = status;

            const embed = this.client.util.embed();

            embed.setTitle(`Syncing channel ${ channel.name }`)
                .setThumbnail(channel.guild.iconURL({ dynamic : true, size : 256 }))
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
    }
};

class Status extends EventEmitter {

    #values = new Map();

    constructor(values) {

        super();

        if (values) {

            this.set(values);
        }
    }

    increase(key, value = 1) {

        this.set({ [key] : (this.#values.get(key) || 0) + value });
    }

    set(values = {}) {

        for (const [key, value] of Object.entries(values)) {

            this.#values.set(key, value);
        }
    }

    update() {

        this.emit('update', this.getAll());
    }

    get(key) {

        return this.#values.get(key);
    }

    getAll() {

        return Object.fromEntries(this.#values);
    }

    toJSON() {

        return this.getAll();
    }
}
