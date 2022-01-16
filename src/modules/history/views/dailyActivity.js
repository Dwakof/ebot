'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember, TextChannel } = require('discord.js');

const { time : Time } = require('@discordjs/builders');

const { View, Util } = require('../../../core');

module.exports = class DailyActivityView extends View {

    /**
     * @param {Guild} guild
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Daily activity for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.stats(embed, stats);

        const { attachment } = await this.chart(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {TextChannel} channel
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Daily activity for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.stats(embed, stats);

        const { attachment } = await this.chart(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {User|GuildMember} [user]
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Daily activity for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.stats(embed, stats);

        const { attachment } = await this.chart(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    stats(embed, stats) {

        const { averageMessagePerPeriod, mostActivePeriod } = stats;

        embed.addField('Average per day', `${ averageMessagePerPeriod.toFixed(2) } messages`, true)
            .addField('Most active day', `${ Time(mostActivePeriod.time, 'R') } with ${ mostActivePeriod.message } messages`, true);
    }

    async chart(embed, stats) {

        const { ChartService } = this.client.services('tooling');

        const Color = this.client.util.color;

        const { dailyActivity } = stats;

        const max = dailyActivity.reduce((acc, { value }) => Math.max(acc, value), 0);

        const colors = Color.scale('Discord').domain([0, max]);

        const buffer = await ChartService.renderToBuffer({
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

        embed.setImage('attachment://chart.png');

        embed.addField('Daily activity', Util.BLANK_CHAR, false);

        return { embed, attachment : this.client.util.attachment(buffer, 'chart.png') };
    }
};
