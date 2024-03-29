'use strict';

const { PermissionsBitField } = require('discord.js');

const { Command } = require('../../../core');

class HelpCommand extends Command {

    constructor() {

        super('help', {
            aliases           : ['help'],
            description       : {
                content : 'Get help',
                usage   : '[command]'
            },
            clientPermissions : [PermissionsBitField.Flags.EmbedLinks, PermissionsBitField.Flags.SendMessages],
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

        const util = this.client.util;

        const embed = util.embed();

        if (command) {

            embed.setTitle(`Command ${ util.code(command.description?.name || command.aliases[0]) }`);

            embed.addFields([
                { name : 'Usage', value : util.code(prefix + command.description?.usage) || 'Unavailable' },
                { name : 'Description', value : command.description?.content || 'Unavailable' },
                { name : 'Usable by', value : command.description?.permissions || 'Everyone' }
            ]);

            if (command.aliases.length > 1) {
                embed.addFields([{ name : 'Alias', value : `${ util.code(command.aliases.join('` • `')) }` }]);
            }

            if (command.description?.examples?.length) {
                embed.addFields([{ name : 'Examples', value : `${ util.code(prefix + command.description.examples.join(`\` • \`${ prefix }`)) }` }]);
            }
        }
        else {
            // For each category, return the array of all the commands it contains, flat it and get its length.
            const number = [...this.handler.categories.values()].flatMap((category) => Array.from(category.values())).length;

            embed.setTitle(`Listing of all the commands (${ number })`)
                .setDescription(`Use ${ util.code(`${ prefix }help [command]`) } to have more information on a command`);

            for (const category of this.handler.categories.values()) {

                embed.addFields([{ name : `${ this.client.util.capitalize(category.id) }`, value : category.map((cmd) => util.code(cmd.aliases[0])).join(' • ') }]);
            }
        }

        return message.util.send({ embeds : [embed] });
    }
}

module.exports = HelpCommand;
