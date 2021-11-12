'use strict';

const { ApplicationCommand } = require('../../../core');

class UwUCommand extends ApplicationCommand {
    constructor() {

        super('uwu', {
            category    : 'meme',
            description : 'Whwen y-you wawnt to swend a cwoot missage to sempwai, OwO',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'uwuify',
            options : {
                message : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'Yowrw cwoot missage, uWu',
                    required    : true
                }
            }
        };
    }

    uwuify(interaction, { message }) {

        const { UwuService } = this.client.services('meme');

        return this.client.util.send(interaction, UwuService.uwuify(message));
    }
}

module.exports = UwUCommand;
