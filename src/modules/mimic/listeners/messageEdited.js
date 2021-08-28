'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class MimicMessageListener extends Listener {

    constructor() {

        super('mimicMessageEdited', { emitter : 'client', event : Constants.Events.MESSAGE_UPDATE });
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

        if (newMessage.author.bot || newMessage.system) {

            return;
        }

        if (this.client.utils.isString(newMessage?.content)) {

            const { Message } = this.client.providers.mimic.models;

            return Message.query()
                .insert({
                    id        : newMessage.id,
                    guildId   : newMessage.guild.id,
                    authorId  : newMessage.author.id,
                    content   : newMessage.content,
                    createdAt : newMessage.createdAt,
                    updatedAt : newMessage.editedAt,
                    imported  : false
                }).onConflict('id').merge();
        }
    }
};
