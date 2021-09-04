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

        const user = await reaction.message.guild.members.fetch(reaction.message.author);

        const guildId   = reaction.message.guild.id;
        const userId    = user.id;
        const messageId = reaction.message.id;
        const giverId   = member.id;
        const type      = Karma.TYPES.REACTION;
        const value     = Karma.emojiToValue(reaction.emoji.identifier);

        if (!value) {

            return;
        }

        if (giverId === userId) {

            return reaction.message.channel.send(Karma.randomResponse(Karma.NARCISSIST_RESPONSES, user, value));
        }

        await Karma.addKarma(this.client, { guildId, userId, messageId, giverId, type, value });

        if (value > 0) {

            return reaction.message.channel.send(Karma.randomResponse(Karma.INCREMENT_RESPONSES, user, value));
        }

        return reaction.message.channel.send(Karma.randomResponse(Karma.DECREMENT_RESPONSES, user, value));
    }
};
