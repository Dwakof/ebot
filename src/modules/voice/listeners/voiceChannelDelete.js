'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class ChannelDeleteListener extends Listener {

    constructor() {

        super(Events.ChannelDelete, { emitter : 'client' });
    }

    /**
     * @param {import('discord.js').GuildChannel} channel
     */
    async exec(channel) {

        const { HubService, TemporaryChannelService } = this.services();

        if (!channel.guildId) {

            return;
        }

        if (await HubService.exist(channel.guildId, channel.id)) {

            await HubService.deleteById(channel.guildId, channel.id);
        }

        if (await TemporaryChannelService.exist(channel.guildId, channel.id)) {

            await TemporaryChannelService.deleteById(channel.guildId, channel.id);
        }
    }
};
