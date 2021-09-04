'use strict';

const { Command }             = require('discord-akairo');
const { CanvasRenderService } = require('chartjs-node-canvas');

const Karma = require('../utils/karma');

module.exports = class GetKarmaCommand extends Command {

    constructor() {

        super('karma', {
            aliases  : ['karma', 'get karma'],
            category : 'karma',
            channel  : 'guild',
            editable : true,
            args     : [
                {
                    id     : 'member',
                    type   : 'member',
                    prompt : {
                        start : 'which member do you want to see the karma balance?'
                    }
                }
            ]
        });

        this.canvas = new CanvasRenderService(1200, 600, (ChartJS) => {

            ChartJS.plugins.register({
                beforeRender : function ({ chart, data, scales, height, ctx }, options) {

                    const dataset = data.datasets[0];
                    const yPos    = scales['y-axis-0'].getPixelForValue(0);

                    const gradientFill = ctx.createLinearGradient(0, 0, 0, height);

                    gradientFill.addColorStop(0, 'rgba(78, 246, 23, 1)');
                    gradientFill.addColorStop(yPos / height, 'rgba(94, 154, 19, 0.7)');
                    gradientFill.addColorStop(yPos / height, 'rgba(153, 9, 9, 0.7)');
                    gradientFill.addColorStop(1, 'rgba(198, 15, 15, 1)');

                    chart.data.datasets[0]._meta[Object.keys(dataset._meta)[0]].dataset._model.backgroundColor = gradientFill;
                }
            });
        });
    }

    async exec(message, { member }) {

        if (member) {

            const embed = this.client.util.embed()
                .setTitle(`Karma for ${ member.user.username }`)
                .setThumbnail(member.user.avatarURL({ dynamic : true, size : 128 }));

            if (member.displayColor !== 0) {

                embed.setColor(member.displayHexColor);
            }

            const info = await Karma.getInfoUser(this.client, message.guild.id, member.user.id);

            if (!info) {

                embed.setDescription('User not ranked yet');

                return message.util.send({ embeds : [embed] });
            }

            let rankString = `${ info.rank }${ Karma.ordinalSuffix(info.rank) }`;

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

            const stats = await Karma.getStatsUser(this.client, message.guild.id, member.user.id);

            if (stats) {

                /**
                 * @type Array<Date>
                 */
                const labels = stats.map(({ time }) => (new Date(time)));

                const attachment = this.client.util.attachment(this.canvas.renderToStream({
                    type    : 'line',
                    data    : {
                        labels,
                        datasets : [
                            {
                                label       : 'karma',
                                steppedLine : false,
                                data        : stats.reduce((acc, { value }) => {

                                    acc.push(parseInt(value));

                                    return acc;
                                }, [])
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
                                    gridLines : { display : false },
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

                }), 'chart.png');

                embed.setImage('attachment://chart.png');

                return message.util.send({ embeds : [embed], files : [attachment] });
            }

            return message.util.send({ embeds : [embed] });
        }
    }
};

