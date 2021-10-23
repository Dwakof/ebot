'use strict';

const { SlashCommand } = require('../../../core');

module.exports = class ScreenshotCommand extends SlashCommand {

    constructor() {

        super('screenshot', {
            category : 'tools',
            // description : 'Search Urban Dictionary for given term',
            type : SlashCommand.Types.MessageCommand
        });
    }


    static get command() {

        return { method : 'screenshot' };
    }

    async screenshot(interaction) {

        const { ScreenshotService } = this.client.services('tools');

        try {

            const something = await ScreenshotService.screenshotMessage(interaction.options.data[0].message);
        }
        catch (error) {

            this.client.logger.error({ err : error });

            this.client.handleError(this, error, interaction);
        }
    }
};
