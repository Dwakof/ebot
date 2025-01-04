'use strict';

const { Events, ChannelType } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class ChannelPermissionUpdatedListener extends Listener {

    constructor() {

        super(Events.ChannelUpdate, { emitter : 'client' });
    }

    /**
     * @param {import('discord.js').GuildChannel} oldChannel
     * @param {import('discord.js').GuildChannel} newChannel
     */
    async exec(oldChannel, newChannel) {

        const { TemporaryChannelService } = this.services();

        if (!newChannel.guildId) {

            return;
        }

        if (newChannel.type === ChannelType.GuildCategory) {

            for (const chanelId of newChannel.children.cache.keys()) {

                const channel = await TemporaryChannelService.getTemporaryChannel(newChannel.guildId, chanelId);

                if (channel && channel.config.type === 'inherit') {

                    await TemporaryChannelService.updatePermission(channel);
                }
            }
        }
    }
};
