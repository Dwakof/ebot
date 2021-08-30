'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../utils/karma');

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

        const guildId   = message.guild.id;
        const messageId = message.id;
        const giverId   = message.author.id;
        const type      = Karma.TYPES.MESSAGE;

        const members = await Karma.parseMessage(this.client, message);

        if (members.size <= 0) {

            return;
        }

        const { Member } = this.client.providers.karma.models;

        const responses = await Promise.all(Array.from(members.entries()).map(async ([id, { member, value }]) => {

            if (id === message.author.id) {

                return Karma.randomResponse(Karma.NARCISSIST_RESPONSES, member);
            }

            await Member.query().insert({ guildId, userId : id, messageId, giverId, type, value })
                .onConflict(['guildId', 'userId', 'messageId', 'giverId', 'type', 'value']).ignore();

            if (value > 0) {

                return Karma.randomResponse(Karma.INCREMENT_RESPONSES, member, value);
            }

            return Karma.randomResponse(Karma.DECREMENT_RESPONSES, member, value);
        }));

        return message.channel.send(responses);
    }
};
