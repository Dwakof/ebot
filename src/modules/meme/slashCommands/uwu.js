'use strict';

const { SlashCommand } = require('../../../core');

class UwUCommand extends SlashCommand {
    constructor() {

        super('uwu', {
            category    : 'meme',
            description : 'Whwen y-you wawnt to swend a cwoot missage two sempwai, OwO',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'uwuify',
            options : {
                message : {
                    type        : SlashCommand.Types.String,
                    description : 'Yowrw cwoot missage, uWu',
                    required    : true
                }
            }
        };
    }

    async uwuify(interaction, { message }) {

        const { UwuService } = this.client.services('meme');

        return this.client.util.send(interaction, UwuService.uwuify(message));
    }
}

module.exports = UwUCommand;
