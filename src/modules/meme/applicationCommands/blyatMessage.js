'use strict';

const { ApplicationCommand } = require('../../../core');

class BlyatMessageCommand extends ApplicationCommand {

    constructor() {

        super('blyДtifЧ', {
            type     : ApplicationCommand.Types.MessageCommand
        });
    }

    static get command() {

        return { method : 'blyatify' };
    }

    async blyatify(interaction) {

        const { BlyatService } = this.services();

        const message = interaction.options.data[0].message;

        await message.reply(BlyatService.blyatify(message.content));

        return this.client.util.send(interaction, { content : BlyatService.blyatify('It has been done friend'), ephemeral: true });
    }
}

module.exports = BlyatMessageCommand;
