'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class HistoryReactionAddedListener extends Listener {

    constructor() {

        super('historyReactionAdded', { emitter : 'client', event : Events.MessageReactionAdd });
    }

    async exec(reaction) {

        if (!reaction.message) {

            return;
        }

        if (reaction.partial) {

            try {
                await reaction.fetch();
            }
            catch (error) {

                return this.client.handleError(this, error, 'Could not fetch the reaction from partial', { reaction });
            }
        }

        if (reaction.message.partial) {

            try {
                await reaction.message.fetch();
            }
            catch (error) {

                return this.client.handleError(this, error, 'Could not fetch the reaction\'s message from partial', { reaction });
            }
        }

        const { HistoryService } = this.services();

        return HistoryService.upsertMessage(reaction.message);
    }
};
