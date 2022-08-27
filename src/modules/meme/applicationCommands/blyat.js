'use strict';

const { ApplicationCommand } = require('../../../core');

class BlyatCommand extends ApplicationCommand {
    constructor() {

        super('blyat', { description : 'Vhen you vant to send a message as a rrussian, blyat' });
    }

    static get command() {

        return {
            method  : 'blyatify',
            options : {
                message : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'Your text',
                    required    : true
                }
            }
        };
    }

    blyatify(interaction, { message }) {

        const { BlyatService } = this.services();

        return this.client.util.send(interaction, BlyatService.blyatify(message));
    }
}

module.exports = BlyatCommand;
