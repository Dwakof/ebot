'use strict';

// eslint-disable-next-line no-unused-vars
const { Snowflake, GuildMember, VoiceChannel, PermissionsBitField, ChannelType } = require('discord.js');
const Lunr                                                                       = require('lunr');

const { Service, Util } = require('../../../core');

class HubService extends Service {

    static get caching() {

        return {
            buildAutoComplete : {
                generateKey : (guild) => guild.id,
                ttl         : Util.SECOND * 30
            }
        };
    }

    /**
     * @typedef {Object} Hub
     * @property {import('discord.js').GuildVoice} channel
     * @property {Object}                          config
     * @property {number}                            config.defaultSize
     * @property {'public'|'locked'|'private'}       config.defaultType
     */

    /**
     * @param {import('discord.js').Guild}     guild
     * @param {string}                         name
     * @param {Hub['config']}                  config
     * @return {Hub}
     */
    async createHub(guild, name, config) {

        const channel = await guild.channels.create({
            type                 : ChannelType.GuildVoice,
            permissionOverwrites : [
                { id : guild.roles.everyone.id, allow : PermissionsBitField.Flags.ViewChannel },
                { id : guild.roles.everyone.id, allow : PermissionsBitField.Flags.Connect },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.Speak },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.UseSoundboard },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.SendMessages },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.SendMessagesInThreads }
            ],
            name
        });

        await this.store.set('hub', guild.id, channel.id, config);

        return { config, channel };
    }

    async exist(guildId, channelId) {

        const hub = await this.store.get('hub', guildId, channelId);

        return !!hub;
    }

    /**
     * @param {import('discord.js').Snowflake} guildId
     * @param {import('discord.js').Snowflake} channelId
     * @return {Hub|null}
     */
    async getHub(guildId, channelId) {

        const hub = await this.store.get('hub', guildId, channelId);

        if (!hub) {

            return null;
        }

        const channel = await this.client.channels.fetch(channelId);

        return { config : hub.value, channel };
    }

    /**
     * @param {import('discord.js').VoiceState} state
     * @return {Hub|null}
     */
    async getHubFromVoiceState(state) {

        if (!state.guild) {

            return null;
        }

        const hub = await this.store.get('hub', state.guild.id, state.channelId);

        if (!hub) {

            return null;
        }

        return { config : hub.value, channel : state.channel };
    }

    /**
     * @param {import('discord.js').Guild} guild
     * @return {{index: Lunr.Index, channels: import('discord.js').BaseGuildVoiceChannel[]}}
     */
    async buildAutoComplete(guild) {

        const hubIds = await this.store.listIds('hub', guild.id);

        const channels = [];

        for (const hubId of hubIds) {

            const channel = guild.channels.cache.get(hubId);

            if (channel) {

                channels.push(channel);
            }
        }

        const index = Lunr(function () {

            this.ref('id');
            this.field('name');
            this.field('parent');

            for (const channel of channels) {

                this.add({ id : channel.id, name : channel.name, parent : channel.parent?.name });
            }
        });

        return { index, channels };
    }

    /**
     * @param {Hub} hub
     * @return {Promise<Hub>}
     */
    async update({ config, channel }) {

        const { value } = await this.store.set('hub', channel.guild.id, channel.id, config);

        return { channel, config : value };
    }

    async deleteHub(hub) {

        await hub.channel.delete().catch(() => null);

        await this.store.delete('hub', hub.channel.guild.id, hub.channel.id);
    }

    async deleteById(guildId, channelId) {

        await this.store.delete('hub', guildId, channelId);
    }
}

module.exports = HubService;
