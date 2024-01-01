'use strict';

// eslint-disable-next-line no-unused-vars
const { Snowflake, GuildMember, VoiceChannel, PermissionsBitField, ChannelType } = require('discord.js');

const { Service } = require('../../../core');

class HubService extends Service {

    /**
     * @typedef {Object} Hub
     * @property {import('discord.js').Snowflake}  id
     * @property {import('discord.js').Snowflake}  guildId
     * @property {import('discord.js').GuildVoice} channel
     * @property {Object}                          config
     * @property {string}                            config.name
     * @property {number}                            config.defaultSize
     * @property {'public'|'locked'|'private'}       config.defaultType
     */

    /**
     * @param {import('discord.js').Guild}     guild
     * @param {Hub['config']}                  config
     * @return {Hub}
     */
    async createHub(guild, config) {

        const channel = await guild.channels.create({
            type                 : ChannelType.GuildVoice,
            name                 : config.name,
            permissionOverwrites : [
                { id : guild.roles.everyone.id, allow : PermissionsBitField.Flags.ViewChannel },
                { id : guild.roles.everyone.id, allow : PermissionsBitField.Flags.Connect },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.Speak },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.UseSoundboard },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.SendMessages },
                { id : guild.roles.everyone.id, deny : PermissionsBitField.Flags.SendMessagesInThreads }
            ]
        });

        await this.store.set('hub', guild.id, channel.id, config);

        return { id : channel.id, config, guildId : guild.id, channel };
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

        return { id : channelId, config : hub.value, guildId, channel };
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

        return { id : state.channelId, config : hub.value, guildId : state.guild.id, channel : state.channel };
    }

    async deleteHub(hub) {

        await hub.channel.delete().catch(() => null);

        await this.store.delete('hub', hub.guildId, hub.id);
    }
}

module.exports = HubService;
