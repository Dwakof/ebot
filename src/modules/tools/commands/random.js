'use strict';

const { Permissions } = require('discord.js');
const { Command }     = require('discord-akairo');

class RandomNumberCommand extends Command {

    constructor() {
        super('random', {
            aliases           : ['random'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args     : [
                {
                    id     : 'min',
                    type   : 'number',
                    prompt : {
                        start : 'What\'s the minimum number you want?'
                    }
                },
                {
                    id     : 'max',
                    type   : 'number',
                    prompt : {
                        start : 'What\'s the maximum number you want?'
                    }
                },
            ],
            description       : {
                content  : 'Returns a random number within given range',
                usage    : 'random <min> <max>',
                examples : ['random 1 4']
            }
        });
    }

    async exec(message, { min, max }) {
        const randomNumber = this.client.utils.randomInt(min, max);
        await message.channel.send(`<@${message.author.id}> your number is ${randomNumber}.`);
    }
};

module.exports = RandomNumberCommand;