'use strict';

const { Colors } = require('discord.js');

const { ApplicationCommand } = require('../../../core');

class AvatarCommand extends ApplicationCommand {

    constructor() {

        super('avatar', {
            description : 'Show avatar of the mentioned user or by default you',
            global      : true
        });
    }

    static get command() {

        return {
            method  : 'getAvatar',
            options : {
                member : {
                    type        : ApplicationCommand.SubTypes.Member,
                    description : 'The user whose avatar you want',
                    required    : false
                }
            }
        };
    }

    getAvatar(interaction, { member }) {

        const user = member ?? interaction.user;

        const embed = this.client.util.embed()
            .setColor(user.displayHexColor || Colors.Navy)
            .setTitle(`Avatar for ${ user.username }`)
            .setImage(user.avatarURL({ dynamic : true, size : 4096 }));

        return interaction.reply({ embeds : [embed] });
    }
}

module.exports = AvatarCommand;
