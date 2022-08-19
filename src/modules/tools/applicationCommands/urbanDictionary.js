'use strict';

const { ApplicationCommand, Util } = require('../../../core');

class UrbanDictionaryCommand extends ApplicationCommand {

    constructor() {

        super('ud', {
            description : 'Search Urban Dictionary for given term',
            global      : true
        });
    }


    static get command() {

        return {
            method  : 'search',
            options : {
                term : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'The term to look up',
                    required    : true
                }
            }
        };
    }

    async search(interaction, { term }) {

        await interaction.deferReply();

        const { UrbanDictionaryService } = this.services();

        try {

            const results = await UrbanDictionaryService.search(term);

            if (results === false) {
                return interaction.editReply({
                    embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('No results found')]
                });
            }

            return new Util.PaginatedEmbeds(interaction, results.map((def) => UrbanDictionaryService.toEmbed(def)));
        }
        catch (error) {

            await interaction.editReply({
                embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('Something went wrong')]
            });

            this.client.handleError(this, error, interaction);
        }
    }
}

module.exports = UrbanDictionaryCommand;
