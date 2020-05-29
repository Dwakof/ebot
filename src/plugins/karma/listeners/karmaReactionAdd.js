'use strict';

const { Listener } = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../karma');

module.exports = class KarmaReactionAddListener extends Listener {

    constructor() {

        super('karmaReactionAdd', { emitter : 'client', event : Constants.Events.MESSAGE_REACTION_ADD });
    }

    async exec(reaction, user) {

        if (reaction.partial) {

            try {
                await reaction.fetch();
            }
            catch (error) {

                return this.client.handleError(this, error, 'Could not fetch the reaction from partial', {
                    reaction,
                    user
                });
            }
        }

        if (!reaction.message.guild) {

            return;
        }

        const authorId = reaction.message.author.id;

        let inc = 0;

        switch (decodeURIComponent(reaction.emoji.identifier)) {
            case '⬆️':
                inc = 1;
                break;
            case '🏅':
                inc = 5;
                break;
            case '⬇️':
                inc = -1;
                break;
            case '🍅':
                inc = -5;
                break;
            default:
                return;
        }

        if (user.id === authorId) {

            return reaction.message.reply(Karma.randomResponse(Karma.NARCISSIST_RESPONSES, user.id, inc));
        }

        await Karma.insertValue(this.client, reaction.message.guild.id, authorId, inc);

        if (inc > 0) {

            return reaction.message.channel.send(Karma.randomResponse(Karma.INCREMENT_RESPONSES, authorId, inc));
        }

        return reaction.message.channel.send(Karma.randomResponse(Karma.DECREMENT_RESPONSES, authorId, inc));
    }
};
