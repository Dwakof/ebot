'use strict';

const { PermissionsBitField } = require('discord.js');

const { Command } = require('../../../core');

module.exports = class ClapCommand extends Command {

    constructor() {

        super('clap', {
            aliases           : ['clap'],
            clientPermissions : [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages],
            args              : [
                {
                    id     : 'text',
                    type   : 'string',
                    prompt : {
                        start : 'Write something so i can replace the space with 👏'
                    },
                    match  : 'rest'
                }
            ],
            description       : {
                content  : 'replace 👏 the 👏 spaces 👏 with 👏 clap 👏',
                usage    : 'clap [text]',
                examples : ['clap replace the spaces with clap']
            }
        });
    }

    async exec(message, args) {

        if (!args.text) {
            return;
        }

        const clap = args.text.replace(/ /g, ' 👏 ');

        await message.delete();
        await message.channel.send(`${ clap } 👏`);
    }
};
