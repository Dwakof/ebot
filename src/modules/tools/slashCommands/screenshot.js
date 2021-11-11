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

            await interaction.deferReply();

            const bufferPromise = ScreenshotService.screenshotMessage(interaction.options.data[0].message);

            await this.client.util.send(interaction, '📷');
            await this.client.util.send(interaction, '📸');
            await this.client.util.send(interaction, '📷');

            const buffer = await bufferPromise;

            return this.client.util.send(interaction, { files : [buffer], content : '⠀' });
        }
        catch (error) {

            this.client.logger.error({ err : error });

            this.client.handleError(this, error, interaction);
        }
    }
};
