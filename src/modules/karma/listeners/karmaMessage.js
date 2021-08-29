'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../utils/karma');

module.exports = class KarmaMessageListener extends Listener {

    static REGEX_KARMA = /(\w+|<@![0-9]+>)(\+\+|--|\+5|-5)/gmi;

    constructor() {

        super('karmaMessage', { emitter : 'client', event : Constants.Events.MESSAGE_CREATE });
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

        const matches = message.content.match(KarmaMessageListener.REGEX_KARMA);

        if (Array.isArray(matches)) {

            const users = new Map();

            for (const string of matches) {

                let nameOrId = string.slice(0, -2);
                let inc      = 0;

                switch (string.slice(-2)) {
                    case '++':
                        inc = 1;
                        break;
                    case '+5':
                        inc = 5;
                        break;
                    case '--':
                        inc = -1;
                        break;
                    case '-5':
                        inc = -5;
                        break;
                    default:
                        return;
                }

                if (this.client.utils.REGEX_USER_MENTION.test(string.slice(0, -2))) {

                    const id = nameOrId.slice(3, nameOrId.length - 1);

                    const member = await message.guild.members.fetch(id);

                    users.set(member.id, { member, inc });

                    continue;
                }

                const [[id, member]] = await message.guild.members.fetch({ query : nameOrId, limit : 1 });

                if (!member.deleted) {

                    users.set(id, { member, inc });
                }

            }

            if (users.size <= 0) {

                return;
            }

            for (const user of users) {

                this.client.logger.info(user);
            }

            const responses = await Promise.all(Array.from(users.entries()).map(async ([id, { member, inc }]) => {

                if (id === message.author.id) {

                    return Karma.randomResponse(Karma.NARCISSIST_RESPONSES, member);
                }

                await Karma.insertValue(this.client, message.guild.id, id, inc);

                if (inc > 0) {

                    return Karma.randomResponse(Karma.INCREMENT_RESPONSES, member, inc);
                }

                return Karma.randomResponse(Karma.DECREMENT_RESPONSES, member, inc);
            }));

            return message.channel.send(responses);
        }
    }
};
