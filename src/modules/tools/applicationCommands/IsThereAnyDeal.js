'use strict';

const { ApplicationCommand, Util } = require('../../../core');

class IsThereAnyDealCommand extends ApplicationCommand {

    constructor() {

        super('deal', {
            category    : 'tools',
            description : 'Displays current price overview',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'getDeals',
            options : {
                title : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'Name of the game',
                    required    : true
                }
            }
        };
    }

    async getDeals(interaction, { title }) {

        const { IsThereAnyDealService } = this.client.services('tools');

        try {
            const searchResults = await IsThereAnyDealService.search(title);

            if (searchResults === false) {
                return interaction.reply(
                    IsThereAnyDealService.messageEmbed(title, 'No results found')
                );
            }

            const search = async (searchResult) => {

                const info = await IsThereAnyDealService.getInfo(searchResult);
                return IsThereAnyDealService.resultEmbed(info);
            };

            return new Util.PaginatedEmbeds(interaction, searchResults.map(search), {
                footerBuilder : (_, index, total) => `Result ${ index + 1 } / ${ total }`
            }).send();
        }
        catch (error) {

            const embed = IsThereAnyDealService.messageEmbed(title, 'Something went wrong');
            await interaction.reply({ embeds : [embed] });
            this.client.handleError(this, error, interaction);
        }
    }
}

module.exports = IsThereAnyDealCommand;
