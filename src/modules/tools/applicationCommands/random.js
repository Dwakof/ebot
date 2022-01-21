'use strict';

const { ApplicationCommand } = require('../../../core');

class RandomNumberCommand extends ApplicationCommand {

    constructor() {

        super('random', {
            description : 'Generates a random number within given range',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'random',
            options : {
                min : {
                    type        : ApplicationCommand.SubTypes.Number,
                    description : 'Minimum',
                    required    : true
                },
                max : {
                    type        : ApplicationCommand.SubTypes.Number,
                    description : 'Maximum',
                    required    : true
                }
            }
        };
    }

    random(interaction, { min, max }) {

        return interaction.reply(`${ this.client.util.randomInt(min, max) }`);
    }
}

module.exports = RandomNumberCommand;
