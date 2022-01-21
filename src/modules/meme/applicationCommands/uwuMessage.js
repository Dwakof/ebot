'use strict';

const { ApplicationCommand } = require('../../../core');

class UwUMessageCommand extends ApplicationCommand {
    constructor() {

        super('uwuify', {
            type     : ApplicationCommand.Types.MessageCommand
        });
    }

    static get command() {

        return { method : 'uwuify' };
    }

    async uwuify(interaction) {

        const { UwuService } = this.services();

        const message = interaction.options.data[0].message;

        await message.reply(UwuService.uwuify(message.content));

        return this.client.util.send(interaction, { content : UwuService.uwuify('I have done it master, I hope will notice me'), ephemeral: true });
    }
}

module.exports = UwUMessageCommand;
