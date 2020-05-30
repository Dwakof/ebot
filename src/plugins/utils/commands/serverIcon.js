'use strict';

const { Permissions } = require('discord.js');
const { Command }     = require('discord-akairo');

class AvatarCommand extends Command {

    constructor() {

        super('icon', {
            aliases           : ['icon'],
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
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

        return message.channel.send(embed);
    }
}

module.exports = AvatarCommand;
