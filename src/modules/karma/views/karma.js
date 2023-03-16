'use strict';

const { View } = require('../../../core');

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, MessageOptions, GuildMember } = require('discord.js');

module.exports = class KarmaView extends View {

    /**
     * @param {GuildMember} member
     *
     * @return {EmbedBuilder}
     */
    baseEmbed(member) {

        const embed = this.embed()
            .setTitle(`Karma for ${ this.username(member) }`)
            .setThumbnail(this.userAvatarURL(member));

        if (member.displayColor) {

            embed.setColor(member.displayColor);
        }

        return embed;
    }

    /**
     * @param {GuildMember} member
     *
     * @return {{embeds: EmbedBuilder[]}}
     */
    notRanked(member) {

        const embed = this.baseEmbed(member).setDescription('User not ranked yet');

        return { embeds : [embed] };
    }

    /**
     * @param {GuildMember}   member
     * @param {KarmaUserInfo} info
     *
     * @return {MessageOptions}
     */
    async render(member, info) {

        const { KarmaService } = this.services();

        const embed = this.baseEmbed(member);

        embed.addFields([
            { name : 'Karma', value : info.karma, inline : true },
            { name : 'Rank', value : this.rank(info.rank, info.total), inline : true }
        ]);

        const result = { embeds : [embed], files : [] };

        if (info.transaction < 2 || (new Date() - info.first) < 50_000) {

            // Cannot display stats as we only have one transaction or
            // 2 transactions too close to each other to calculate a clean graph

            return result;
        }

        const stats = await KarmaService.getStatsUser(member.guild.id, member.id);

        if (stats) {

            result.files.push(this.client.util.attachment(await this.renderGraph(stats), 'chart.png'));

            embed.setImage('attachment://chart.png');
        }

        return result;
    }

    /**
     * @param {Array<KarmaUserStats>} stats
     *
     * @return {Promise<Buffer>}
     */
    renderGraph(stats) {

        const { ChartService } = this.services('core');

        const GREEN = '#12d512';
        const RED   = '#cb1111';

        return ChartService.renderToBuffer({
            width   : 1200,
            height  : 600,
            type    : 'line',
            data    : {
                datasets : [
                    {
                        label                  : 'karma',
                        fill                   : true,
                        cubicInterpolationMode : 'monotone',
                        data                   : stats.map(({ time, value }) => ({ x : time.getTime(), y : value })),
                        parsing                : false,
                        normalized             : true,
                        borderColor            : ChartService.linearVerticalSplitAtZeroBackgroundColorGradient(
                            this.client.util.color(GREEN).darken(0.2).css(),
                            this.client.util.color(GREEN).darken(0.2).alpha(0.5).css(),
                            this.client.util.color(RED).darken(0.2).alpha(0.5).css(),
                            this.client.util.color(RED).darken(0.2).css()
                        ),
                        backgroundColor        : ChartService.linearVerticalSplitAtZeroBackgroundColorGradient(
                            this.client.util.color(GREEN).darken(0.3).css(),
                            this.client.util.color(GREEN).darken(0.4).alpha(0).css(),
                            this.client.util.color(RED).darken(0.4).alpha(0).css(),
                            this.client.util.color(RED).darken(0.3).css()
                        )
                    }
                ]
            },
            options : {
                elements : { point : { radius : 0 } },
                plugins  : { legend : { display : false } },
                scales   : ChartService.basicTimeSeriesScales({
                    x : {
                        ticks : {
                            maxTicksLimit : 7
                        }
                    }
                })
            }
        });
    }
};
