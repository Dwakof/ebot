'use strict';

const { SlashCommand } = require('../../../core');

class CoinFlipCommand extends SlashCommand {

    constructor() {
        super('coin', { category : 'tools', description : 'Flips a coin' });
    }

    static get command() {
        return { method  : 'flip', options: {} };
    }

    async flip(interaction, args) {
        return interaction.reply(this.client.util.randomInt() ? 'Heads' : 'Tails');
    }
}

module.exports = CoinFlipCommand;