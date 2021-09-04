'use strict';

const { EventEmitter } = require('events');

const { SnowflakeUtil, Constants } = require('discord.js');

const { Routes } = require('discord-api-types/v9');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

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
}

const internals = {

    FIRST_MESSAGE_ID : SnowflakeUtil.generate(SnowflakeUtil.EPOCH),

    async * fetchAllMessages(client, channel, limit = 100) {

        let after = internals.FIRST_MESSAGE_ID;

        let messages;

        while (after) {

            messages = await channel.messages.fetch({ after, limit });

            if (messages.size > 0) {

                yield Array.from(messages.values());
            }

            after = (Array.from(messages.keys()) || []).sort().pop();
        }
    },

    async syncGuild(client, guildId, message) {

        const { State } = client.providers('history');

        const status = new Status({ startAt : new Date(), current : 0, doing : true, done : false });

        status.on('update', (status) => {

            return internals.progressGuild(client, guild, status, message);
        });

        let guild;

        try {

            const { doing } = await State.get('guild_import', guildId, { doing : false });

            if (doing) {

                return;
            }

            guild = await client.guilds.fetch(guildId);

            status.set({ current : 1, total : guild.channels.cache.size, messages : 0 });

            await State.set('guild_import', guildId, status.getAll());

            const { id, channel } = await internals.progressGuild(client, guild, status.getAll(), message);

            status.set({ url : `https://discordapp.com/channels/${ guildId }/${ channel.id }/${ id }` });

            await State.set('guild_import', guildId, status.getAll());

            client.logger.info({ message : `Started guild ${ guildId } (${ guild.name }) import`, status });

            for (const [channelId, channel] of guild.channels.cache) {

                if (channel.isText()) {

                    await internals.syncChannel(client, channelId, null, status);
                }

                status.increase('current');

                await State.set('guild_import', guildId, status.getAll());

                status.update();
            }

            status.set({ done : true, doing : false });

            client.logger.info({
                message : `Finished guild ${ guildId } (${ guild.name }) import with ${ status.messages } messages imported`,
                status  : status.getAll()
            });
        }
        catch (error) {

            status.set({ failed : true });

            client.logger.error({ message : `Could not sync message for guild ${ guildId }`, error, status });
            client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('guild_import', guildId, status.getAll());
        }
    },

    async syncChannel(client, channelId, message, parentStatus) {

        const { State, History } = client.providers('history');

        const status = { startAt : new Date(), current : 0, doing : true, done : false };

        try {

            const { doing } = await State.get('channel_import', channelId, { doing : false });

            if (doing) {

                return false;
            }

            await State.set('channel_import', channelId, status);

            const channel = await client.channels.fetch(channelId);

            client.logger.info({ message : `Started channel ${ channelId } (${ channel.name }) import`, status });

            const { Message } = History.models;

            for await (const messages of internals.fetchAllMessages(client, channel)) {

                await Message.query().insert(internals.toMessage(messages)).onConflict('id').merge();

                status.current += messages.length;

                await State.set('channel_import', channelId, status);

                if (parentStatus) {

                    parentStatus.increase('messages', messages.length);

                    parentStatus.update();
                }

                await client.util.wait(750);
            }

            status.done  = true;
            status.endAt = new Date();
            status.doing = false;

            await State.set('channel_import', channelId, status);

            client.logger.info({
                message : `Finished channel ${ channelId } (${ channel.name }) import with ${ status.current } messages imported`,
                status
            });

            return status.current;
        }
        catch (error) {

            status.failed = true;
            status.endAt  = new Date();

            client.logger.error({ message : `Could not sync message for channel ${ channelId }`, error });
            client.logger.error(error);
        }
        finally {

            status.doing = false;

            await State.set('channel_import', channelId, status);
        }
    },

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
    },

    progressGuild(client, guild, status, message) {

        if (message && guild && status) {

            const { messages, current, total, doing, startAt, endAt, done, failed } = status;

            const embed = client.util.embed();

            embed.setTitle(`Syncing guild ${ guild.name }`)
                .setThumbnail(guild.iconURL({ dynamic : true, size : 256 }))
                .setColor(Constants.Colors.BLUE);

            embed.setDescription(`${ messages || 0 } messages across ${ current || 0 } channels`);

            embed.addField('Progress', client.util.progressBar(current, total));

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
};

module.exports = internals;
