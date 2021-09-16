'use strict';

const { SlashCommand } = require('../../../core');

const Got = require('got');

class IsThereAnyDealCommand extends SlashCommand {

    constructor() {
        super('deal', {
            category    : 'tools',
            description : 'Displays current price overview' 
        });
    }

    static get command() {
        return {
            method  : 'getDeals',
            options : {
                title : {
                    type        : SlashCommand.Types.String,
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

            return this.client.util.replyPaginatedEmbeds(
                interaction,
                searchResults.map(async (searchResult) => {
                    const info = await IsThereAnyDealService.getInfo(searchResult); 
                    return IsThereAnyDealService.resultEmbed(info);
                }), {
                footerBuilder: (_, index, total) => {
                    return `Result ${index + 1} / ${total}`;
                },   
            });
        } catch (error) {
            const embed = IsThereAnyDealService.messageEmbed(title, 'Something went wrong');
            await interaction.reply({ embeds: [ embed ] });
            this.client.handleError(this, error, interaction);
        }
    }
};

module.exports = IsThereAnyDealCommand;
