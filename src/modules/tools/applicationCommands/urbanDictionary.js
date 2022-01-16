'use strict';

const { ApplicationCommand, Util } = require('../../../core');

class UrbanDictionaryCommand extends ApplicationCommand {

    constructor() {

        super('ud', {
            category    : 'tools',
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

        const { UrbanDictionaryService } = this.client.services('tools');

        try {

            const results = await UrbanDictionaryService.search(term);

            if (results === false) {
                return interaction.reply({
                    embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('No results found')]
                });
            }

            return new Util.PaginatedEmbeds(interaction, results.map((def) => UrbanDictionaryService.toEmbed(def))).send();
        }
        catch (error) {

            await interaction.reply({
                embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('Something went wrong')]
            });

            this.client.handleError(this, error, interaction);
        }
    }
}

module.exports = UrbanDictionaryCommand;
