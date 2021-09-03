'use strict';

const { Permissions } = require('discord.js');
const { Command }     = require('discord-akairo');

class CoinFlipCommand extends Command {

    constructor() {
        super('coin', {
            aliases           : ['coin', 'coinflip'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args              : [],
            description       : {
                content  : 'Heads or Tails',
                usage    : 'coin',
                examples : ['coin', 'coinflip']
            }
        });
    }

    async exec(message, args) {
        const randomNumber = this.client.utils.randomInt(0, 1);
        await message.channel.send(randomNumber === 0 ? 'Heads' : 'Tails');
    }
};

module.exports = CoinFlipCommand;
