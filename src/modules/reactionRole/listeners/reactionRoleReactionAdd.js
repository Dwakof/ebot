'use strict';

const { Events } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class reactionRoleReactionAddListener extends Listener {

    constructor() {

        super('reactionRoleReactionAdd', { emitter : 'client', event : Events.MessageReactionAdd });
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
