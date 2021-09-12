'use strict';

const { Constants } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class KarmaReactionRemoveListener extends Listener {

    constructor() {

        super('karmaReactionRemove', { emitter : 'client', event : Constants.Events.MESSAGE_REACTION_REMOVE });
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

        const guildId   = reaction.message.guild.id;
        const userId    = reaction.message.author.id;
        const messageId = reaction.message.id;
        const giverId   = member.id;
        const type      = KarmaService.TYPES.REACTION;
        const value     = KarmaService.emojiToValue(reaction.emoji.identifier);

        if (!value) {

            return;
        }

        return KarmaService.cancelKarma({ guildId, userId, messageId, giverId, type, value });
    }
};
