'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class HistoryMessageEditedListener extends Listener {

    constructor() {

        super('historyMessageEdited', { emitter : 'client', event : Constants.Events.MESSAGE_UPDATE });
    }

    async exec(oldMessage, newMessage) {

        if (!newMessage.guild) {

            return;
        }

        if (newMessage.partial) {

            try {
                await newMessage.fetch();
            }
            catch (error) {

                return this.client.handleError(this, error, 'Could not fetch the message from partial', { newMessage });
            }
        }

        const { HistoryService } = this.client.services('history');

        return HistoryService.upsertMessage(newMessage);
    }
};
