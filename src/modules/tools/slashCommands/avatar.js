'use strict';

const { Constants } = require('discord.js');

const { SlashCommand } = require('../../../core');

class AvatarCommand extends SlashCommand {

    constructor() {

        super('avatar', {
            category          : 'tools',
            description       : 'Show avatar of the mentioned user or by default you'
        });
    }

    static get command() {
        return {
            method  : 'getAvatar',
            options : {
                member : {
                    type        : SlashCommand.Types.Member,
                    description : 'The user whose avatar you want',
                    required    : false
                }
            }
        };
    }

    async getAvatar(interaction, { member }) {
        const user = member ?? interaction.user;

        const embed = this.client.util.embed()
            .setColor(user.displayHexColor || Constants.Colors.NAVY)
            .setTitle(`Avatar for ${ user.username }`)
            .setImage(user.avatarURL({ dynamic : true, size : 4096 }));

        return interaction.reply({ embeds : [embed] });
    }
}

module.exports = AvatarCommand;
