'use strict';

const { Permissions } = require('discord.js');

const { Command } = require('../../../core');

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

    exec(message, args) {

        return message.channel.send(this.client.util.randomInt() ? 'Heads' : 'Tails');
    }
}

module.exports = CoinFlipCommand;
