'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

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

        // React only if kek is used in a sentence.
        if (/.kek.*|.*kek./gi.test(message.content)) {

            return message.react('🍰');
        }
    }
};
