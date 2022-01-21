'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

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

        const { HistoryService } = this.services();

        return HistoryService.upsertMessage(message);
    }
};
