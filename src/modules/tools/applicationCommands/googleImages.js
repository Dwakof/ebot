'use strict';

const { ApplicationCommand, Util } = require('../../../core');

class GoogleImagesCommand extends ApplicationCommand {
    constructor() {

        super('image', {
            description : 'Searches Google Images',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'search',
            options : {
                query : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'Query to search for',
                    required    : true
                }
            }
        };
    }

    async search(interaction, { query }) {

        const { GoogleImagesService } = this.services();

        try {

            const results = await GoogleImagesService.search(query);

            if (results === false) {
                return interaction.reply({
                    embeds : [GoogleImagesService.embed().setTitle(query).setDescription('No results found')]
                });
            }

            return new Util.PaginatedEmbeds(interaction, results.map((result) => GoogleImagesService.toEmbed(result)), {
                footer : (_, index, total) => `Result ${ index + 1 } / ${ total }`
            }).send();
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
