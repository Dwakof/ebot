'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../utils/karma');

module.exports = class KarmaMessageDeletedListener extends Listener {

    constructor() {

        super('karmaMessageDeleted', { emitter : 'client', event : Constants.Events.MESSAGE_DELETE });
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

        for (const [userId, { value }] of members) {

            await Karma.cancelKarma(this.client, { guildId, userId, messageId, giverId, type, value });
        }
    }
};
