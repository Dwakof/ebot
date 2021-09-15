'use strict';

const { SlashCommand } = require('../../../core');

class UrbanDictionaryCommand extends SlashCommand {

    constructor() {
        super('ud', {
            category          : 'tools',
            description       : 'Search Urban Dictionary for given term',
        });
    }


    static get command() {
        return {
            method   : 'search',
            options  : {
                term : {
                    type        : SlashCommand.Types.String,
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

            return this.client.util.replyPaginatedEmbeds(interaction, results.map((def) => UrbanDictionaryService.toEmbed(def)));
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
