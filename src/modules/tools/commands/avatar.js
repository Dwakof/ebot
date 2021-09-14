'use strict';

const { Permissions, Constants } = require('discord.js');

const { Command } = require('../../../core');

class AvatarCommand extends Command {

    constructor() {

        super('avatar', {
            aliases           : ['avatar'],
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES, Permissions.FLAGS.EMBED_LINKS],
            channel           : 'guild',
            args              : [
                {
                    id      : 'member',
                    type    : 'member',
                    default : (message) => message.member
                }
            ],
            description       : {
                content  : 'Show avatar of the mentioned user or by default you',
                usage    : '(optional) [@user]',
                examples : ['', '@user', 'username']
            }
        });
    }

    exec(message, { member }) {

        const embed = this.client.util.embed()
            .setColor(member.displayHexColor || Constants.Colors.NAVY)
            .setTitle(`Avatar for ${ member.user.username }`)
            .setImage(member.user.avatarURL({ dynamic : true, size : 4096 }));

        return message.channel.send({ embeds : [embed] });
    }
}

module.exports = AvatarCommand;
