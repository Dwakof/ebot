'use strict';

const { v4 : Uuidv4 } = require('uuid');
const BezierEasing    = require('bezier-easing');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember, TextChannel } = require('discord.js');

const { time : Time } = require('@discordjs/builders');

const { View, Util } = require('../../../core');

module.exports = class WeeklyActivityView extends View {

    /**
     * @param {Guild} guild
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Weekly activity for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.stats(embed, stats);

        const { attachment } = await this.heatmap(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {TextChannel} channel
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Weekly activity for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.stats(embed, stats);

        const { attachment } = await this.heatmap(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {User|GuildMember} [user]
     * @param stats
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Weekly Stats for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.stats(embed, stats);

        const { attachment } = await this.heatmap(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    stats(embed, stats) {

        const { averageMessagePerPeriod, mostActivePeriod } = stats;

        embed.addField('Average per week', `${ averageMessagePerPeriod.toFixed(2) } messages`, true)
            .addField('Most active week', `${ Time(mostActivePeriod.time, 'R') } with ${ mostActivePeriod.message } messages`, true);
    }

    async heatmap(embed, stats, options = {}) {

        const { weeklyActivity } = stats;

        const { ChartService } = this.client.services('tooling');

        const days  = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
        const hours = Array.from(Array(24).keys()).map((hour) => `${ hour }h`.padStart(3, '0'));

        let data = weeklyActivity.map(({ hour, day, value }) => ({ x : hours[hour], y : days[day === 0 ? 6 : day - 1], value }));

        const { scale = 'Discord', padding = 5, borderRadius = 15, borderWidth = 0, width = 1600, height = 500, id = Uuidv4() } = options;

        data = Util.normalize(data, 100, 'value');

        const max = data.reduce((acc, { value }) => Math.max(acc, value), 0);

        const easing = BezierEasing(0, 0.5, 0, 0);

        const colors = this.client.util.color.scale(scale).domain([-50, max]);

        const buffer = await ChartService.renderToBuffer({
            width, height,
            type    : 'matrix',
            data    : {
                datasets : [
                    {
                        data,
                        borderRadius : ({ dataIndex, dataset }) => {

                            const valuePercent = Math.max(dataset.data[dataIndex].value / 100, 0.01);

                            return borderRadius * easing(valuePercent);
                        },
                        borderWidth,
                        borderColor  : 'rgba(255,255,255,0.05)',
                        width        : ({ chart, dataIndex, dataset }) => {

                            const cellSize     = (chart.chartArea || {}).width / hours.length - padding + 1;
                            const valuePercent = Math.max(dataset.data[dataIndex].value / 100, 0.01);

                            return cellSize * easing(valuePercent);
                        },
                        height       : ({ chart, dataIndex, dataset }) => {

                            const cellSize     = (chart.chartArea || {}).height / days.length - padding;
                            const valuePercent = Math.max(dataset.data[dataIndex].value / 100, 0.01);

                            return cellSize * easing(valuePercent);
                        },
                        backgroundColor(context) {

                            return colors(context.dataset.data[context.dataIndex].value).css();
                        }
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : {
                    y : {
                        type    : 'category',
                        labels  : days,
                        offset  : true,
                        reverse : false,
                        left    : 'left',
                        align   : 'center',
                        ticks   : ChartService.basicTicksConfig(),
                        grid    : { display : false, drawBorder : false },
                        title   : { display : false }
                    },
                    x : {
                        type     : 'category',
                        labels   : hours,
                        offset   : true,
                        position : 'bottom',
                        ticks    : ChartService.basicTicksConfig(),
                        grid     : { display : false, drawBorder : false },
                        title    : { display : false }
                    }
                }
            }
        });

        embed.addField('Weekly activity', Util.BLANK_CHAR, false);
        embed.setImage(`attachment://${ id }.png`);

        return { embed, attachment : this.client.util.attachment(buffer, `${ id }.png`) };
    }
};
