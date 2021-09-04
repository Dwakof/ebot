'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

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

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        return Message.query()
            .insert({
                id        : newMessage?.id,
                guildId   : newMessage?.guild?.id,
                authorId  : newMessage?.author?.id,
                content   : newMessage?.content,
                createdAt : newMessage?.createdAt,
                updatedAt : newMessage?.editedAt || new Date()
            }).onConflict('id').merge();
    }
};
