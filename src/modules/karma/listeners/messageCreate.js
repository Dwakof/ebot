'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class KarmaMessageCreatedListener extends Listener {

    constructor() {

        super('karmaMessageCreated', { emitter : 'client', event : Constants.Events.MESSAGE_CREATE });
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

                return this.client.handleError(this, error, 'Could not fetch the message from partial', { message });
            }
        }

        const { KarmaService } = this.client.services('karma');

        const guildId   = message.guild.id;
        const messageId = message.id;
        const giverId   = message.author.id;
        const type      = KarmaService.TYPES.MESSAGE;

        const members = await KarmaService.parseMessage(message);

        if (members.size <= 0) {

            return;
        }

        const responses = await Promise.all(Array.from(members.entries()).map(async ([id, { member, value }]) => {

            if (id === message.author.id) {

                return KarmaService.randomResponse(KarmaService.NARCISSIST_RESPONSES, member);
            }

            await KarmaService.addKarma({ guildId, userId : id, messageId, giverId, type, value });

            // if (value > 0) {
            //
            //     return KarmaService.randomResponse(KarmaService.INCREMENT_RESPONSES, member, value);
            // }
            //
            // return KarmaService.randomResponse(KarmaService.DECREMENT_RESPONSES, member, value);

            return false;
        }));

        console.log(responses.filter(Boolean));

        return this.client.util.send(message, responses.filter(Boolean).join('\n'));
    }
};
