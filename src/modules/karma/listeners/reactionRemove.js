'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../utils/karma');

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

        const guildId   = reaction.message.guild.id;
        const userId    = reaction.message.author.id;
        const messageId = reaction.message.id;
        const giverId   = member.id;
        const type      = Karma.TYPES.REACTION;
        const value     = Karma.emojiToValue(reaction.emoji.identifier);

        if (!value) {

            return;
        }

        return Karma.cancelKarma(this.client, { guildId, userId, messageId, giverId, type, value });
    }
};
