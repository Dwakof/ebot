'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../utils/karma');

module.exports = class KarmaReactionAddListener extends Listener {

    constructor() {

        super('karmaReactionAdd', { emitter : 'client', event : Constants.Events.MESSAGE_REACTION_ADD });
    }

    async exec(reaction, member) {

        if (reaction.partial) {

            try {
                await reaction.fetch();
            }
            catch (error) {

                return this.client.handleError(this, error, 'Could not fetch the reaction from partial', {
                    reaction,
                    member
                });
            }
        }

        if (!reaction.message.guild) {

            return;
        }

        const author = reaction.message.author;

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

        if (member.id === author.id) {

            return reaction.message.channel.send(Karma.randomResponse(Karma.NARCISSIST_RESPONSES, author, inc));
        }

        await Karma.insertValue(this.client, reaction.message.guild.id, author, inc);

        if (inc > 0) {

            return reaction.message.channel.send(Karma.randomResponse(Karma.INCREMENT_RESPONSES, author, inc));
        }

        return reaction.message.channel.send(Karma.randomResponse(Karma.DECREMENT_RESPONSES, author, inc));
    }
};
