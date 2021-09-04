'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

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

        const { KarmaService } = this.client.services('karma');

        const user = await reaction.message.guild.members.fetch(reaction.message.author);

        const guildId   = reaction.message.guild.id;
        const userId    = user.id;
        const messageId = reaction.message.id;
        const giverId   = member.id;
        const type      = KarmaService.TYPES.REACTION;
        const value     = KarmaService.emojiToValue(reaction.emoji.identifier);

        if (!value) {

            return;
        }

        if (giverId === userId) {

            return reaction.message.channel.send(KarmaService.randomResponse(KarmaService.NARCISSIST_RESPONSES, user, value));
        }

        await KarmaService.addKarma({ guildId, userId, messageId, giverId, type, value });

        if (value > 0) {

            return reaction.message.channel.send(KarmaService.randomResponse(KarmaService.INCREMENT_RESPONSES, user, value));
        }

        return reaction.message.channel.send(KarmaService.randomResponse(KarmaService.DECREMENT_RESPONSES, user, value));
    }
};
