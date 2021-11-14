'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class ScreenshotCommand extends ApplicationCommand {

    constructor() {

        super('screenshot', {
            category : 'tools',
            // description : 'Search Urban Dictionary for given term',
            type : ApplicationCommand.Types.MessageCommand
        });
    }


    static get command() {

        return { method : 'screenshot' };
    }

    async screenshot(interaction) {

        const { ScreenshotService } = this.client.services('tools');

        try {

            const message = interaction.options.data[0].message;

            const bufferPromise = ScreenshotService.screenshotMessage(message);

            await this.client.util.send(interaction, { content : 'It has been done sir', ephemeral: true }); // I need to reply to the interaction

            const reply = await message.reply('📷');

            await reply.edit('📸');
            await reply.edit('📷');

            const buffer = await bufferPromise;

            await reply.edit({ files : [buffer], content : '⠀' });
        }
        catch (error) {

            this.client.logger.error({ err : error });

            this.client.handleError(this, error, interaction);
        }
    }
};
