'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class HistoryReactionRemovedListener extends Listener {

    constructor() {

        super('historyReactionRemoved', { emitter : 'client', event : Constants.Events.MESSAGE_REACTION_REMOVE });
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

        const { HistoryService } = this.client.services('history');

        return HistoryService.upsertMessage(reaction.message);
    }
};
