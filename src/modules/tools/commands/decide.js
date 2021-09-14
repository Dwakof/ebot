'use strict';

const { Permissions } = require('discord.js');

const { Command } = require('../../../core');

class DecideCommand extends Command {

    constructor() {

        super('decide', {
            aliases           : ['decide'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args              : [
                {
                    id   : 'options',
                    type : 'string'
                }
            ],
            description       : {
                content  : 'Makes a random decision on one of the given options',
                usage    : 'decide [options]',
                examples : ['decide option1 option2']
            }
        });
    }

    exec(message, args) {

        const input = message.content.replace(/[~!?]decide/, '').trim();

        if (input.length === 0) {
            return message.channel.send('Please specify some options (e.g. "option1 option2")');
        }

        const options = input.split(' ');
        const result  = this.client.util.randomValue(options);

        const inputWithHighlightedResult = input.replace(/ /g, ' | ').replace(result, `**${ result }**`);

        return message.channel.send(inputWithHighlightedResult);
    }
}

module.exports = DecideCommand;
