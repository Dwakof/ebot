'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class CakeMessageListener extends Listener {

    constructor() {

        super('cake', { emitter : 'client', event : Constants.Events.MESSAGE_CREATE });
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

        if (/kek/gi.test(message.content)) {

            return message.react('🍰');
        }
    }
};
