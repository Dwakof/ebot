'use strict';

const { PermissionsBitField } = require('discord.js');

const { Command } = require('../../../core');

class AvatarCommand extends Command {

    constructor() {

        super('icon', {
            aliases           : ['icon'],
            clientPermissions : [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks],
            channel           : 'guild',
            description       : {
                content : 'Show icon of the server'
            }
        });
    }

    exec(message, args) {

        const embed = this.client.util.embed()
            .setTitle(`Icon for ${ message.guild.name }`)
            .setImage(message.guild.iconURL({ dynamic : true, size : 4096 }));

        return message.channel.send({ embeds : [embed] });
    }
}

module.exports = AvatarCommand;
