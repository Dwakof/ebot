'use strict';

const { SlashCommand } = require('../../../core');

module.exports = class Karma extends SlashCommand {

    static name        = 'karma';
    static description = 'A descriptions';


    // static get subcommands() {
    //
    //     return {
    //         user  : {
    //             method      : 'getUser',
    //             description : 'Show the karma for a specific users',
    //             options     : {
    //                 user : {
    //                     type        : SlashCommand.Types.User,
    //                     description : 'User to get the karma info from',
    //                     required    : true
    //                 }
    //             }
    //         },
    //         guild : {
    //             method      : 'getGuild',
    //             description : 'Show the karma for the entire guild'
    //         }
    //     };
    // }

    // static get subgroups() {
    //
    //     return {
    //         user  : {
    //             description : 'Karma command related to an user',
    //             subcommands : {
    //                 get : {
    //                     method      : 'getUser',
    //                     description : 'Show the karma for a specific users',
    //                     options     : {
    //                         user : {
    //                             type        : SlashCommand.Types.User,
    //                             description : 'User to get the karma info from',
    //                             required    : true
    //                         }
    //                     }
    //                 }
    //             }
    //         },
    //         guild : {
    //             description : 'Karma command related to the guild',
    //             subcommands : {
    //                 get : {
    //                     method      : 'getGuild',
    //                     description : 'Show the karma for the entire guild'
    //                 }
    //             }
    //         }
    //     };
    // }

    static get command() {

        return {
            method  : 'getUser',
            options : {
                user : {
                    type        : SlashCommand.Types.Member,
                    description : 'User to get the karma info from',
                    required    : true
                }
            }
        };
    }

    async getUser(interaction, { user }) {

        const { KarmaService } = this.client.services('karma');

        const embed = this.client.util.embed()
            .setTitle(`Karma for ${ user.username }`)
            .setThumbnail(user.avatarURL({ dynamic : true, size : 128 }));

        if (user.displayColor !== 0) {

            embed.setColor(user.displayHexColor);
        }

        const info = await KarmaService.getInfoUser(interaction.guildId, user.id);

        if (!info) {

            embed.setDescription('User not ranked yet');

            return interaction.reply({ embeds : [embed] });
        }

        let rankString = `${ info.rank }${ KarmaService.ordinalSuffix(info.rank) }`;

        switch (info.rank) {
            case '1':
                rankString = `:first_place: ${ rankString }`;
                break;
            case '2':
                rankString = `:second_place:️️ ${ rankString }`;
                break;
            case '3':
                rankString = `:third_place: ${ rankString }`;
                break;
            case info.total:
                rankString = `:poop: ${ rankString }`;
                break;
            default:
        }

        embed.addFields([
            { name : 'Karma', value : info.karma, inline : true },
            { name : 'Rank', value : rankString, inline : true }
        ]);

        if (info.transaction < 2 || (new Date() - info.first) < 50000) {

            // Cannot display stats as we only have 1 transactions or
            // 2 transactions too close to calculate a graph

            return interaction.reply({ embeds : [embed] });
        }

        const stats = await KarmaService.getStatsUser(interaction.guildId, user.id);

        if (stats) {

            const attachment = this.client.util.attachment(KarmaService.renderGraph(stats), 'chart.png');

            embed.setImage('attachment://chart.png');

            return interaction.reply({ embeds : [embed], files : [attachment] });
        }

        return interaction.reply({ embeds : [embed] });
    }

    getGuild(interaction) {

        console.log(interaction);

        interaction.reply('Pong');
    }
};
