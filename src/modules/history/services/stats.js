'use strict';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment } = require('discord.js');

const { Service } = require('../../../core');

module.exports = class StatsService extends Service {

    init() {

        this.canvasService = new ChartJSNodeCanvas({ width : 1200, height : 600 });
    }

    /**
     * @param {Array<{ time : Date, value : Number }>}  stats
     * @param {Guild} guild
     * @param {User} user
     * @param color
     * @returns {{files : MessageAttachment[], embeds : MessageEmbed[]}}
     */
    getCountMessageOverTimeView(stats, { guild, user, color = '#1DAE5C' }) {

        const embed = this.client.util.embed()
            .setTitle(`Stats for ${ guild.name }`)
            .setThumbnail(guild.iconURL({ dynamic : true, size : 128 }))
            .setColor(color);

        if (user) {

            embed.setTitle(`Stats for ${ user.username }`)
                .setThumbnail(user.avatarURL({ dynamic : true, size : 128 }));

            if (user.hexAccentColor) {

                embed.setColor(user.hexAccentColor);
            }
        }

        embed.addField('Messages', `${ stats.reduce((acc, { value }) => acc + value, 0) }`, false);

        const stream = this.canvasService.renderToStream({
            type    : 'bar',
            data    : {
                labels   : stats.map(({ time }) => time),
                datasets : [
                    {
                        label           : 'messages',
                        barPercentage   : 1,
                        backgroundColor : embed.hexColor,
                        borderRadius    : 5,
                        data            : stats.map(({ value }) => value)
                    }
                ]
            },
            options : {
                legend   : { display : false },
                elements : {
                    point : {
                        radius : 0
                    }
                },
                scales   : {
                    xAxes : [
                        {
                            time      : { round : true },
                            type      : 'time',
                            gridLines : { display : false },
                            ticks     : {
                                source    : 'auto',
                                fontColor : 'rgba(142, 146, 151, 1)',
                                fontSize  : 20
                            }
                        }
                    ],
                    yAxes : [
                        {
                            gridLines : {
                                display    : true,
                                borderDash : [2, 3]
                            },
                            ticks     : {
                                precision    : 0,
                                suggestedMin : 0,
                                suggestedMax : 0,
                                fontColor    : 'rgba(142, 146, 151, 1)',
                                fontSize     : 20
                            }
                        }
                    ]
                }
            }
        });

        embed.setImage('attachment://chart.png');

        return { embeds : [embed], files : [this.client.util.attachment(stream, 'chart.png')] };
    }

    async getCountMessageOverTime(options) {

        const { History } = this.client.providers('history');

        const { Message } = History.models;

        const { fn, raw, ref } = Message;

        const { authorId, guildId, channelId, after = fn.min(ref('createdAt')), before = fn.now(), datapoint = 100 } = options;

        const where   = {};
        const groupBy = [];

        if (guildId) {

            where.guildId = guildId;
            groupBy.push('guildId');
        }

        if (authorId) {

            where.authorId = authorId;
            groupBy.push('authorId');
        }

        if (channelId) {

            // where.channelId = channelId;
            // groupBy.push('channelId');
        }

        const stats = await Message.query()
            .with('info',
                Message.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM ?? - ??)`, [before, after])
                }).where(where)
            )
            .with('periods',
                Message.query().select({
                    interval : raw('FLOOR(?? / ?)::bigint', ['interval', datapoint + 1]),
                    after    : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM ??)::bigint,
                                EXTRACT(EPOCH FROM ??)::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, ['min', 'max', 'interval', datapoint + 1])
                }).from('info')
            )
            .select({
                after : ref('after').from('periods'),
                time  : raw('TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ?? / 2)', [ref('after').from('periods'), ref('interval').from('periods')]),
                value : Message.query()
                    .count('*')
                    .from(Message.tableName)
                    .where(where)
                    .where('createdAt', '>=', ref('after').from('periods'))
                    .whereRaw('?? < TO_TIMESTAMP(EXTRACT(EPOCH FROM ??) + ??)', [
                        ref('createdAt'),
                        ref('after').from('periods'),
                        ref('interval').from('periods')
                    ])
                    .groupBy(...groupBy)
            }).from('periods');

        return stats.map(({ time, value }) => {

            return { time : new Date(time), value : parseFloat(value) || 0 };
        }).slice(0, datapoint);
    }
};
