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

        const { HubService } = this.services();

        if (!channel.guildId) {

            return;
        }

        const hub = await HubService.getHub(channel.guildId, channel.id);

        if (hub) {

            await HubService.deleteHub(hub);
        }
    }
};
