'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class VoiceStateUpdateListener extends Listener {

    constructor() {

        super(Events.VoiceStateUpdate, { emitter : 'client' });
    }

    /**
     * @param {import('discord.js').VoiceState} oldState
     * @param {import('discord.js').VoiceState} newState
     */
    async exec(oldState, newState) {

        const { HubService, TemporaryChannelService } = this.services();

        if (newState.channelId) {

            const hub = await HubService.getHubFromVoiceState(newState);

            if (hub) {

                const { channel } = await TemporaryChannelService.createTemporaryChannel(hub, newState.member);

                await newState.setChannel(channel, 'Temporary channel created');

                return;
            }
        }

        if (oldState?.channelId) {

            if (oldState.channel.members.size === 0) {

                const temporaryChannel = await TemporaryChannelService.getTemporaryChannelFromVoiceState(oldState);

                if (temporaryChannel) {

                    // Clean up in 3 minutes
                    setTimeout(() => TemporaryChannelService.deleteTemporaryChannel(temporaryChannel.channel), 1_000 * 3);
                }
            }
        }
    }
};
