'use strict';

const { SlashCommand } = require('../../../core');

class RandomNumberCommand extends SlashCommand {

    constructor() {
        super('random', { 
            category: 'tools',
            description: 'Generates a random number within given range',
        });
    }

    static get command() {
        return {
            method  : 'random',
            options : {
                min : {
                    type        : SlashCommand.Types.Number,
                    description : 'Minimum',
                    required    : true
                },
                max : {
                    type        : SlashCommand.Types.Number,
                    description : 'Maximum',
                    required    : true
                }
            }
        };
    }

    async random(interaction, { min, max }) {
        return interaction.reply(`${this.client.util.randomInt(min, max)}`);
    }
}

module.exports = RandomNumberCommand;
