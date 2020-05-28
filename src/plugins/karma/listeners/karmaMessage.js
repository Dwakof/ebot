'use strict';

const { Listener }  = require('discord-akairo');
const { Constants } = require('discord.js');

const Karma = require('../karma');

module.exports = class KarmaMessageListener extends Listener {

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

        const matches = message.content.match(Karma.REGEX_KARMA);

        if (Array.isArray(matches)) {

            const users = new Map();

            for (const string of matches) {

                const nameOrId = string.slice(0, -2);
                let inc        = 0;

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

                if (Karma.REGEX_DISCORD_USER_ID.test(string.slice(0, -2))) {

                    users.set(nameOrId.slice(3, nameOrId.length - 1), inc);
                }
                else {

                    const members = await message.guild.members.fetch({ query : nameOrId, limit : 1 });

                    members.forEach((member) => {

                        if (!member.deleted) {

                            users.set(member.user.id, inc);
                        }
                    });
                }
            }

            if (users.size <= 0) {

                return;
            }

            const responses = await Promise.all(Array.from(users.entries()).map(async ([id, inc]) => {

                if (id === message.author.id) {

                    return Karma.randomResponse(Karma.NARCISSIST_RESPONSES, id, inc);
                }

                await Karma.insertValue(this.client, message.guild.id, id, inc);

                if (inc > 0) {

                    return Karma.randomResponse(Karma.INCREMENT_RESPONSES, id, inc);
                }

                return Karma.randomResponse(Karma.DECREMENT_RESPONSES, id, inc);
            }));

            return message.channel.send(responses);
        }
    }
};
