'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class HistoryMessageEditedListener extends Listener {

    constructor() {

        super('historyMessageEdited', { emitter : 'client', event : Events.MessageUpdate });
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

        const { HistoryService } = this.services();

        return HistoryService.upsertMessage(newMessage);
    }
};
