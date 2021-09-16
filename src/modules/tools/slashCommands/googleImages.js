'use strict';

const { SlashCommand } = require('../../../core');

class GoogleImagesCommand extends SlashCommand {
    constructor() {
        super('image', {
            category    : 'tools',
            description : 'Searches Google Images'
        });
    }

    static get command() {
        return {
            method  : 'search',
            options : {
                query : {
                    type        : SlashCommand.Types.String,
                    description : 'Query to search for',
                    required    : true
                }
            }
        };
    }

    async search(interaction, { query }) {

        const { GoogleImagesService } = this.client.services('tools');

        try {

            const results = await GoogleImagesService.search(query);

            if (results === false) {
                return interaction.reply({
                    embeds : [GoogleImagesService.embed().setTitle(query).setDescription('No results found')]
                });
            }

            return this.client.util.replyPaginatedEmbeds(
                interaction,
                results.map((result) => GoogleImagesService.toEmbed(result)), {
                footerBuilder: (_, index, total) => `Result ${ index + 1 } / ${total}`,
            });
        }
        catch (error) {

            await interaction.reply({
                embeds : [GoogleImagesService.embed().setTitle(query).setDescription('Something went wrong')]
            });

            this.client.handleError(this, error, interaction);
        }
    }
}

module.exports = GoogleImagesCommand;
