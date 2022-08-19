'use strict';

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, Guild, User, GuildMember, TextChannel } = require('discord.js');

const { time : Time } = require('discord.js');

const { View, Util } = require('../../../core');

module.exports = class DailyActivityView extends View {

    /**
     * @param {Guild} guild
     * @param stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Daily activity for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.stats(embed, stats);

        await this.chart(embed, stats);

        return embed;
    }

    /**
     * @param {TextChannel} channel
     * @param stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Daily activity for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.stats(embed, stats);

        await this.chart(embed, stats);

        return embed;
    }

    /**
     * @param {User|GuildMember} [user]
     * @param stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Daily activity for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.stats(embed, stats);

        await this.chart(embed, stats);

        return embed;
    }

    stats(embed, stats) {

        const { averageMessagePerPeriod, mostActivePeriod } = stats;

        embed.addFields([
            { name : 'Average per day', value : `${ averageMessagePerPeriod.toFixed(2) } messages`, inline : true },
            { name : 'Most active day', value : `${ Time(mostActivePeriod.time, 'R') } with ${ mostActivePeriod.message } messages`, inline : true }
        ]);
    }

    async chart(embed, stats) {

        const { ChartService } = this.services('core');

        const Color = this.client.util.color;

        const { dailyActivity } = stats;

        const max = dailyActivity.reduce((acc, { value }) => Math.max(acc, value), 0);

        const colors = Color.scale('Discord').domain([0, max]);

        const url = await ChartService.renderAndUpload({
            width   : 1600,
            height  : 800,
            type    : 'polarArea',
            data    : {
                labels   : dailyActivity.map(({ hour }) => `${ hour }h`),
                datasets : [
                    {
                        data            : dailyActivity.map(({ value }) => value),
                        borderColor     : 'rgba(255, 255, 255, 0.0)',
                        borderWidth     : 5,
                        borderAlign     : 'inner',
                        borderJoinStyle : 'round',
                        backgroundColor : function (context) {

                            const { chartArea } = context.chart;

                            const arcColor = colors(dailyActivity[context.dataIndex].value);

                            if (!chartArea) {

                                return arcColor;
                            }

                            const { top, right, bottom, left } = chartArea;

                            const x = (left + right) / 2;
                            const y = (top + bottom) / 2;
                            const r = Math.min((right - left) / 2, (bottom - top) / 2);

                            const gradient = context.chart.ctx.createRadialGradient(x, y, 0, x, y, r);

                            gradient.addColorStop(0, Color(arcColor).desaturate(0.2).darken(0.2).css());
                            gradient.addColorStop(0.5, Color(arcColor).brighten(0.2).css());
                            gradient.addColorStop(0, Color(arcColor).brighten(0.1).css());

                            return gradient;
                        }
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : {
                    r : {
                        max,
                        min         : 0,
                        startAngle  : -(360 / 24 / 2),
                        ticks       : { display : false },
                        grid        : { display : false },
                        pointLabels : ChartService.basicTicksConfig({ centerPointLabels : true })
                    }
                }
            }
        });

        embed.addFields([{ name : 'Daily activity', value : Util.BLANK_CHAR, inline : false }]);

        embed.setImage(url);

        return embed;
    }
};
