'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class HistoryMessageCreatedListener extends Listener {

    constructor() {

        super('historyMessageCreated', { emitter : 'client', event : Constants.Events.MESSAGE_CREATE });
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

        const { HistoryService } = this.client.services('history');

        return HistoryService.upsertMessage(message);
    }
};
