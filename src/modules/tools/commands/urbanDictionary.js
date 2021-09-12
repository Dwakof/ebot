'use strict';

const { Permissions } = require('discord.js');

const { Command } = require('../../../core');

class UrbanDictionaryCommand extends Command {

    constructor() {

        super('ud', {
            aliases           : ['ud', 'urban', 'urbandictionary'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args              : [
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

        const { UrbanDictionaryService } = this.client.services('tools');

        try {

            const results = await UrbanDictionaryService.search(term);

            if (results === false) {

                return message.util.send({
                    embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('No results found')]
                });
            }

            return this.client.util.replyPaginatedEmbeds(message, results.map((def) => UrbanDictionaryService.toEmbed(def)));
        }
        catch (error) {

            await message.util.send({
                embeds : [UrbanDictionaryService.embed().setTitle(term).setDescription('Something went wrong')]
            });

            this.client.handleError(this, error, message);
        }
    }
}

module.exports = UrbanDictionaryCommand;
