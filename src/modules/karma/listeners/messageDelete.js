'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class KarmaMessageDeletedListener extends Listener {

    constructor() {

        super('karmaMessageDeleted', { emitter : 'client', event : Events.MessageDelete });
    }

    async exec(message) {

        if (!message.guild) {

            return;
        }

        if (message.partial) {

            try {
                await message.fetch();
            }
            catch (error) {

                if (error.code === 10008) {

                    return;
                }

                return this.client.handleError(this, error, 'Could not fetch the message from partial', { message });
            }
        }

        const { KarmaService } = this.services();

        const guildId   = message.guild.id;
        const messageId = message.id;
        const giverId   = message.author.id;
        const type      = KarmaService.TYPES.MESSAGE;

        const members = await KarmaService.parseMessage(message);

        if (members.size <= 0) {

            return;
        }

        for (const [userId, { value }] of members) {

            await KarmaService.cancelKarma({ guildId, userId, messageId, giverId, type, value });
        }
    }
};
