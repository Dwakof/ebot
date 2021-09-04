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

        if (this.client.util.isString(message?.content)) {

            const { History } = this.client.providers('history');

            const { Message } = History.models;

            return Message.query()
                .insert({
                    id        : message.id,
                    guildId   : message.guild.id,
                    authorId  : message.author.id,
                    content   : message.content,
                    createdAt : message.createdAt,
                    updatedAt : message.editedAt || new Date()
                });
        }
    }
};
