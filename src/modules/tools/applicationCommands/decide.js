'use strict';

const { ApplicationCommand } = require('../../../core');

class DecideCommand extends ApplicationCommand {

    constructor() {

        super('decide', {
            category    : 'tools',
            description : 'Makes a random decision on one of the given options',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'decide',
            options : {
                choices : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'The options to choose from',
                    required    : true
                }
            }
        };
    }

    decide(interaction, { choices }) {

        const input   = choices.trim();
        const options = input.split(' ');
        const result  = this.client.util.randomValue(options);

        const inputWithHighlightedResult = input.replace(/ /g, ' | ').replace(result, `**${ result }**`);

        return interaction.reply(inputWithHighlightedResult);
    }
}

module.exports = DecideCommand;
