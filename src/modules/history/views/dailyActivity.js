'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember } = require('discord.js');

const { View } = require('../../../core');

module.exports = class DailyActivityView extends View {

    /**
     * @param {Guild}            guild
     * @param {User|GuildMember} [user]
     * @param stats
     * @param {Object}           options
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async render(guild, user, { stats, average }, options = {}) {

        const { color = '#404EED', scale = 'Discord' } = options;

        const embed = this.client.util.embed()
            .setTitle(`Daily Stats for ${ guild.name }`)
            .setThumbnail(guild.iconURL({ dynamic : true, size : 128 }))
            .setColor(color);

        if (user) {

            embed.setTitle(`Daily Stats for ${ user.username }`)
                .setThumbnail(user.avatarURL({ dynamic : true, size : 128 }));
        }

        const { ChartService } = this.client.services('chart');

        const max = stats.reduce((acc, { value }) => Math.max(acc, value), 0);

        const colors = ChartService.Color.scale(scale).domain([0, max]);

        const buffer = await ChartService.renderToBuffer({
            width   : 800,
            height  : 800,
            type    : 'polarArea',
            data    : {
                labels   : stats.map(({ hour }) => `${ hour }h`),
                datasets : [
                    {
                        data            : stats.map(({ value }) => value),
                        borderColor     : 'rgba(255, 255, 255, 0.0)',
                        borderWidth     : 5,
                        borderAlign     : 'inner',
                        borderJoinStyle : 'round',
                        backgroundColor : function (context) {

                            const { chartArea } = context.chart;

                            const arcColor = colors(stats[context.dataIndex].value);

                            if (!chartArea) {

                                return arcColor;
                            }

                            const { top, right, bottom, left } = chartArea;

                            const x = (left + right) / 2;
                            const y = (top + bottom) / 2;
                            const r = Math.min((right - left) / 2, (bottom - top) / 2);

                            const gradient = context.chart.ctx.createRadialGradient(x, y, 0, x, y, r);

                            gradient.addColorStop(0, ChartService.Color(arcColor).desaturate(0.2).darken(0.2).css());
                            gradient.addColorStop(0.5, ChartService.Color(arcColor).brighten(0.2).css());
                            gradient.addColorStop(0, ChartService.Color(arcColor).brighten(0.1).css());

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

        return { embeds : [embed], files : [this.client.util.attachment(buffer, 'chart.png')] };
    }
};
