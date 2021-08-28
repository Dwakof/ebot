'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class MimicMessageListener extends Listener {

    constructor() {

        super('mimicMessageCreated', { emitter : 'client', event : Constants.Events.MESSAGE_CREATE });
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

        if (message.author.bot || message.system) {

            return;
        }

        if (this.client.utils.isString(message?.content)) {

            const { Message } = this.client.providers.mimic.models;

            return Message.query()
                .insert({
                    id        : message.id,
                    guildId   : message.guild.id,
                    authorId  : message.author.id,
                    content   : message.content,
                    createdAt : message.createdAt
                });
        }
    }
};
