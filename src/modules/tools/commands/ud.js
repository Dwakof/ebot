'use strict';

const { Permissions, MessageButton } = require('discord.js');
const { Command }     = require('discord-akairo');
const paginatedEmbed = require('../../../core/paginatedEmbed');

const Got = require('got');

class UrbanDictionaryCommand extends Command {

    #udApi;

    constructor() {
        super('ud', {
            aliases           : ['ud'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args     : [
                {
                    id     : 'term',
                    type   : 'string',
                    prompt : {
                        start : 'What\'s the term you want to look up?'
                    }
                }
            ],
            description       : {
                content  : 'Displays Urban Dictionary results for specified term',
                usage    : 'ud [term]',
                examples : ['ud boi']
            }
        });
    }

    async exec(message, { term }) {
        if (!this.#udApi) {
            this.#udApi = Got.extend({ 
                prefixUrl: 'https://api.urbandictionary.com', 
                responseType : 'json'
            });
        }

        try {
            const { body, statusCode } =
                        await this.#udApi.get('v0/define', { searchParams : { term: term } });
            
            if (statusCode > 200 || !Array.isArray(body.list) || body.list.length <= 0) {
                const embed = this.buildMessageEmbed(term, 'No results found');
                return message.util.send({ embeds: [ embed ] });
            }

            const rankedResults = body.list.sort((one, two) => two.thumbs_up - one.thumbs_up);

            const pages = rankedResults.map((result) => this.buildResultEmbed(rankedResults, result));

            const buttons = [
                new MessageButton()
                    .setCustomId("previous")
                    .setLabel("Previous")
                    .setStyle("SECONDARY"),
                new MessageButton()
                    .setCustomId("next")
                    .setLabel("Next")
                    .setStyle("SECONDARY"),
            ];

            return paginatedEmbed(message, pages, buttons, { useDefaultFooter: false });
        } catch (error) {
            const embed = this.buildMessageEmbed(term, 'Something went wrong');
            await message.util.send({ embeds: [ embed ] });
            this.client.handleError(this, error, message);
        }
    }

    buildResultEmbed(results, result) {
        const index = results.indexOf(result);

        // Strip brackets from some words.
        const cleanedUpDef = result.definition.replace(/\[(.+?)\]/g, (_, capture) => capture);

        return this.buildUdEmbed()
            .setURL(result.permalink)
            .setTitle(result.word)
            .setDescription(cleanedUpDef)
            .setFooter(`Result ${index + 1} / ${results.length}`)
            .addFields([
                { name: 'Author', value: result.author ?? '?', inline: true },
                { name: 'Thumbs up', value: result.thumbs_up?.toString() ?? '?', inline: true  },
                { name: 'Thumbs down', value: result.thumbs_down?.toString() ?? '?', inline: true  },
            ]);
    }

    buildMessageEmbed(title, message) {
        const embed = this.buildUdEmbed()
        if (title) embed.setTitle(title)
        return embed.setDescription(message);
    }

    buildUdEmbed() {
        return this.client.util.embed()
            .setColor('#EFFF00')
            .setThumbnail('https://i.imgur.com/rMoErZd.png');
    }
};

module.exports = UrbanDictionaryCommand;
