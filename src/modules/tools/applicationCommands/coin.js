'use strict';

const { ApplicationCommand } = require('../../../core');

class CoinFlipCommand extends ApplicationCommand {

    constructor() {

        super('coin', {
            category    : 'tools',
            description : 'Flips a coin',
            global      : true
        });
    }

    static get command() {

        return { method : 'flip', options : {} };
    }

    flip(interaction) {

        return interaction.reply(this.client.util.randomInt() ? 'Heads' : 'Tails');
    }
}

module.exports = CoinFlipCommand;
