'use strict';

const { Permissions } = require('discord.js');
const { Command }     = require('discord-akairo');

class HelpCommand extends Command {

    constructor() {
        super('help', {
            aliases           : ['help'],
            description       : {
                content : 'Get help',
                usage   : '[command]'
            },
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.SEND_MESSAGES],
            ratelimit         : 2,
            args              : [
                {
                    id   : 'command',
                    type : 'commandAlias'
                }
            ]
        });
    }

    exec(message, { command }) {

        const { prefix } = this.handler;

        const embed = this.client.util.embed();

        if (command) {

            embed.setTitle(`Command \`${ command.description?.name || command.aliases[0] }\``);

            embed.addField('Usage', `\`${ prefix }${ command.description?.usage }\`` || 'Unavailable');
            embed.addField('Description', command.description?.content || 'Unavailable');
            embed.addField('Usable by', command.description?.permissions || 'Everyone');

            if (command.aliases.length > 1) {
                embed.addField('Alias', `\`${ command.aliases.join('` • `') }\``);
            }

            if (command.description?.examples?.length) {
                embed.addField('Examples', `\`${ prefix }${ command.description.examples.join(`\` • \`${ prefix }`) }\``);
            }

        }
        else {
            // For each category, return the array of all the commands it contains, flat it and get its length.
            const number = this.handler.categories.array().flatMap((category) => category.array()).length;

            embed.setTitle(`Listing of all the commands (${ number })`)
                .setDescription(`Use \`${ prefix } help [command]\` to have more information on a command`);

            for (const category of this.handler.categories.array()) {

                embed.addField(`${ this.client.utils.capitalize(category.id) }`, category.map((cmd) => `\`${ cmd.aliases[0] }\``).join(' • '));
            }
        }

        return message.util.send(embed);

    }
}

module.exports = HelpCommand;
