'use strict';

const { Command }             = require('discord-akairo');
const { CanvasRenderService } = require('chartjs-node-canvas');

const Karma = require('../../utils/karma/karma');

module.exports = class GetKarmaCommand extends Command {

    constructor() {

        super('karma', {
            aliases  : ['karma'],
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

            const [info, stats] = await Promise.all([
                Karma.getInfoUser(this.client, message.guild.id, member.user.id),
                Karma.getStatsUser(this.client, message.guild.id, member.user.id)
            ]);

            if (!info) {

                embed.setDescription('User not ranked yet');

                return message.util.send(embed);
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

            if (stats) {

                /**
                 * @type Array<Date>
                 */
                const labels = stats.map(({ time }) => (new Date(time * 1000)));

                const firstDay = labels[0];
                const lastDay  = labels.slice(-1)[0];

                const elapsedDay = (lastDay - firstDay) / 1000 / 60 / 60 / 24;

                let time = { unit : 'day' };

                if (elapsedDay > 30) { // 1+ Months timeline

                    time = { unit : 'month' };
                }

                const attachment = this.client.util.attachment(this.canvas.renderToStream({
                    type    : 'line',
                    data    : {
                        labels,
                        datasets : [
                            {
                                label       : 'karma',
                                steppedLine : false,
                                data        : stats.reduce((acc, { value }, i) => {

                                    acc.push(parseInt(value) + acc[i]);

                                    return acc;
                                }, [0]).slice(1)
                            }
                        ]
                    },
                    options : {
                        legend : { display : false },
                        scales : {
                            xAxes : [
                                {
                                    time,
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

                embed.attachFiles([attachment]).setImage('attachment://chart.png');
            }

            embed.addFields([
                { name : 'Karma', value : info.karma, inline : true },
                { name : 'Rank', value : rankString, inline : true }
            ]);

            return message.util.send(embed);
        }
    }
};

