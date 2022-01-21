'use strict';

const { Command } = require('../../../core');

module.exports = class GetKarmaCommand extends Command {

    constructor() {

        super('karma', {
            aliases     : ['karma'],
            channel     : 'guild',
            editable    : true,
            args        : [
                {
                    id       : 'member',
                    type     : 'member',
                    required : false
                }
            ],
            description : {
                content  : 'Get karma stats for a user, by default you',
                usage    : 'karma [user]',
                examples : ['karma', 'karma @ecto']
            }
        });
    }

    async exec(message, { member }) {

        if (!member) {

            member = message.guild.members.cache.get(message.author.id);
        }

        const { KarmaService } = this.services();

        const embed = this.client.util.embed()
            .setTitle(`Karma for ${ member.user.username }`)
            .setThumbnail(member.user.avatarURL({ dynamic : true, size : 128 }));

        if (member.displayColor !== 0) {

            embed.setColor(member.displayHexColor);
        }

        const info = await KarmaService.getInfoUser(message.guild.id, member.user.id);

        if (!info) {

            embed.setDescription('User not ranked yet');

            return message.util.send({ embeds : [embed] });
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

            return message.util.send({ embeds : [embed] });
        }

        const stats = await KarmaService.getStatsUser(message.guild.id, member.user.id);

        if (stats) {

            const attachment = this.client.util.attachment(KarmaService.renderGraph(stats), 'chart.png');

            embed.setImage('attachment://chart.png');

            return message.util.send({ embeds : [embed], files : [attachment] });
        }

        return message.util.send({ embeds : [embed] });
    }
};

