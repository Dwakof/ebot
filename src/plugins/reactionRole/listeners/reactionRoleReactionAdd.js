'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

module.exports = class reactionRoleReactionAddListener extends Listener {

    constructor() {

        super('reactionRoleReactionAdd', { emitter : 'client', event : Constants.Events.MESSAGE_REACTION_ADD });
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

        // TODO
    }
};
