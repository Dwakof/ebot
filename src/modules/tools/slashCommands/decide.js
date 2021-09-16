'use strict';

const { SlashCommand } = require('../../../core');

class DecideCommand extends SlashCommand {

    constructor() {
        super('decide', { 
            category: 'tools',
            description: 'Makes a random decision on one of the given options',
        });
    }

    static get command() {
        return {
            method  : 'decide',
            options : {
                choices : {
                    type        : SlashCommand.Types.String,
                    description : 'The options to choose from',
                    required    : true
                }
            }
        };
    }

    async decide(interaction, { choices }) {
        const input = choices.trim();
        const options = input.split(' ');
        const result  = this.client.util.randomValue(options);

        const inputWithHighlightedResult = input.replace(/ /g, ' | ').replace(result, `**${ result }**`);

        return interaction.reply(inputWithHighlightedResult);
    }
}

module.exports = DecideCommand;
