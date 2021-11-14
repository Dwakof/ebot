'use strict';

const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const { Canvas }            = require('skia-canvas');

const { Chart }    = require('chart.js');
const ChartJSLuxon = require('chartjs-adapter-luxon');

class ChartJSSkiaCanvas {

    constructor(options = {}) {

        const { width, height } = options;

        this.width  = width;
        this.height = height;

        this.chartJS = Chart;

        this.chartJS.register(ChartJSLuxon);
    }

    /**
     * @param configuration
     * @param mine
     * @param options
     *
     * @returns {Promise<Buffer>}
     */
    renderToBuffer(configuration, mine, options) {

        const { chart, canvas } = this.renderGraph(configuration);

        // chart.render();

        return canvas.toBuffer(mine, options);
    }

    /**
     * @param configuration
     *
     * @return {Object}
     */
    renderGraph(configuration) {

        const canvas = new Canvas(this.width, this.height);

        configuration.options            = configuration.options || {};
        configuration.options.responsive = false;
        configuration.options.annimation = false;

        for (const scaleId of Object.keys(configuration.options.scales)) {

            configuration.options.scales[scaleId].grid                      = configuration.options.scales[scaleId].grid ?? {};
            configuration.options.scales[scaleId].grid.borderDashOffset     = configuration.options.scales[scaleId].grid.borderDashOffset ?? 0.0;
            configuration.options.scales[scaleId].grid.tickBorderDashOffset = configuration.options.scales[scaleId].grid.tickBorderDashOffset ?? configuration.options.scales[scaleId].grid.borderDashOffset;
        }

        const context = canvas.getContext('2d');

        return { chart : new this.chartJS(context, configuration), canvas, context };
    }
}

const { Service } = require('../../../core');

module.exports = class KarmaService extends Service {

    REGEX_KARMA = /(\w+|<@![0-9]+>)(\+\+|--|\+5|-5)/gmi;

    TYPES = { REACTION : 'reaction', MESSAGE : 'message' };

    NARCISSIST_RESPONSES = [
        ({ displayName }) => `Hey everyone ! ${ displayName } is a narcissist !`
    ];

    INCREMENT_RESPONSES = [
        ({ displayName }, inc) => `${ displayName } +${ inc } !`,
        ({ displayName }, inc) => `${ displayName } gained ${ inc > 1 ? inc : 'a' } level${ inc > 1 ? 's' : '' } !`,
        ({ displayName }, inc) => `${ displayName } is on the rise ! (${ inc } point${ inc > 1 ? 's' : '' })`,
        ({ displayName }, inc) => `Toss ${ inc > 1 ? inc : 'a' } karma to your ${ displayName }, oh valley of plenty !`,
        ({ displayName }, inc) => `${ displayName } leveled up ${ inc > 1 ? `${ inc } times in a row` : '' } !`
    ];

    DECREMENT_RESPONSES = [
        ({ displayName }, inc) => `${ displayName } took ${ inc < -1 ? inc : 'a' } hit${ inc < -1 ? 's' : '' } ! Ouch.`,
        ({ displayName }, inc) => `${ displayName } took a dive (${ inc } point${ inc < -1 ? 's' : '' }).`,
        ({ displayName }, inc) => `${ displayName } lost ${ inc < -1 ? inc : 'a' } life${ inc < -1 ? 's' : '' }.`,
        ({ displayName }, inc) => `${ displayName } lost ${ inc < -1 ? inc : 'a' } level${ inc < -1 ? 's' : '' }.`
    ];

    randomResponse(array, ...args) {

        return array[Math.floor(Math.random() * array.length)](...args);
    }

    emojiToValue(emoji) {

        switch (decodeURIComponent(emoji)) {
            case '⬆️':
                return 1;
            case '🏅':
                return 5;
            case '⬇️':
                return -1;
            case '🍅':
                return -5;
            default:
                return null;
        }
    }

    ordinalSuffix(i) {

        const j = i % 10;
        const k = i % 100;

        if (j === 1 && k !== 11) {
            return 'st';
        }

        if (j === 2 && k !== 12) {
            return 'nd';
        }

        if (j === 3 && k !== 13) {
            return 'rd';
        }

        return 'th';
    }

    getInfoUser(guildId, userId) {

        const { Karma } = this.client.providers('karma');

        const { Member } = Karma.models;

        return Member.query()
            .with('sumTable', Member.query()
                .select('guildId', 'userId')
                .count({ transaction : '*' })
                .sum({ karma : 'value' })
                .min({ first : 'createdAt' })
                .groupBy('guildId', 'userId')
            )
            .with('rankTable', Member.query()
                .select([
                    '*',
                    Member.knex().raw('RANK() OVER ( ORDER BY karma DESC ) rank'),
                    Member.knex().raw(`COUNT(*) OVER () total`)
                ])
                .from('sumTable')
            )
            .from('rankTable')
            .where({ guildId, userId })
            .limit(1).first();
    }

    async getStatsUser(guildId, userId) {

        const { Karma } = this.client.providers('karma');

        const { Member } = Karma.models;

        const { fn, raw, ref } = Member;

        const stats = await Member.query()
            .with('info',
                Member.query().select({
                    min      : fn.min(ref('createdAt')),
                    max      : fn.now(),
                    interval : raw(`EXTRACT(EPOCH FROM ?? - ??)`, [
                        fn.now(),
                        fn.min(ref('createdAt'))
                    ])
                }).where({ guildId, userId })
            )
            .with('periods',
                Member.query().select({
                    period : raw(`
                        TO_TIMESTAMP(
                            GENERATE_SERIES(
                                EXTRACT(EPOCH FROM ??)::bigint,
                                EXTRACT(EPOCH FROM ??)::bigint,
                                FLOOR(?? / ?)::bigint
                            )
                        )`, ['min', 'max', 'interval', 50])
                }).from('info')
            )
            .select({
                time  : raw('??::timestamp', ['period']),
                value : Member.query()
                    .select(fn.coalesce(fn.sum(ref('value')), 0))
                    .from(Member.tableName)
                    .where({ guildId, userId })
                    .where('createdAt', '<', ref('period').from('periods'))
            }).from('periods');

        return stats.map(({ time, value }) => {

            return { time : new Date(time), value : parseFloat(value) };
        });
    }

    /**
     * @param {DiscordJS.Message} message
     *
     * @return {Promise<Map<Snowflake, { member : DiscordJS.GuildMember, value : integer }>>}
     */
    async parseMessage(message) {

        const users = new Map();

        const matches = message.content.match(this.REGEX_KARMA);

        if (Array.isArray(matches)) {

            for (const string of matches) {

                const nameOrId = string.slice(0, -2);

                let value = 0;

                switch (string.slice(-2)) {
                    case '++':
                        value = 1;
                        break;
                    case '+5':
                        value = 5;
                        break;
                    case '--':
                        value = -1;
                        break;
                    case '-5':
                        value = -5;
                        break;
                    default:
                        return;
                }

                if (this.client.util.REGEX_USER_MENTION.test(string.slice(0, -2))) {

                    const id = nameOrId.slice(3, nameOrId.length - 1);

                    const member = await message.guild.members.fetch(id);

                    users.set(member.id, { member, value });

                    continue;
                }

                const [[id, member]] = await message.guild.members.fetch({ query : nameOrId, limit : 1 });

                if (!member.deleted) {

                    users.set(id, { member, value });
                }

            }
        }

        return users;
    }

    /**
     * @param {Object}     karma
     * @param {Snowflake}  karma.guildId
     * @param {Snowflake}  karma.userId
     * @param {Snowflake}  karma.messageId
     * @param {Snowflake}  karma.giverId
     * @param {String}     karma.type
     * @param {Number}     karma.value
     *
     * @return {Promise}
     */
    addKarma(karma) {

        const { Karma } = this.client.providers('karma');

        const { Member } = Karma.models;

        return Member.query().insert(karma)
            .onConflict(['guildId', 'userId', 'messageId', 'giverId', 'type', 'value']).ignore();
    }

    /**
     * @param {Snowflake}  guildId
     * @param {Snowflake}  userId
     * @param {Snowflake}  messageId
     * @param {Snowflake}  giverId
     * @param {String}     type
     * @param {Number}     value
     *
     * @return {Promise}
     */
    cancelKarma({ guildId, userId, messageId, giverId, type, value }) {

        const { Karma } = this.client.providers('karma');

        const { Member } = Karma.models;

        return Member.query().deleteById([guildId, userId, messageId, giverId, type, value]);
    }


    // canvasService = new ChartJSNodeCanvas(1200, 600, (ChartJS) => {
    //
    //     ChartJS.plugins.register({
    //         beforeRender : function ({ chart, data, scales, height, ctx }, options) {
    //
    //             const dataset = data.datasets[0];
    //             const yPos    = scales['y-axis-0'].getPixelForValue(0);
    //
    //             const gradientFill = ctx.createLinearGradient(0, 0, 0, height);
    //
    //             gradientFill.addColorStop(0, 'rgba(78, 246, 23, 1)');
    //             gradientFill.addColorStop(yPos / height, 'rgba(94, 154, 19, 0.7)');
    //             gradientFill.addColorStop(yPos / height, 'rgba(153, 9, 9, 0.7)');
    //             gradientFill.addColorStop(1, 'rgba(198, 15, 15, 1)');
    //
    //             chart.data.datasets[0]._meta[Object.keys(dataset._meta)[0]].dataset._model.backgroundColor = gradientFill;
    //         }
    //     });
    // });

    init() {

        // this.canvasService = new ChartJSNodeCanvas({ width : 1200, height : 600, plugins : { modern : [require('chartjs-adapter-luxon')] } });
        this.canvasService = new ChartJSSkiaCanvas({ width : 1200, height : 600 });
    }

    /**
     * @param {Array<Object>} stats
     *
     * @return {Promise<Buffer>}
     */
    renderGraph(stats) {

        return this.canvasService.renderToBuffer({
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
                        backgroundColor        : 'rgba(78, 246, 23, 1)'
                        // backgroundColor        : function (context) {
                        //
                        //     const { scales, chartArea } = context.chart;
                        //
                        //     if (!chartArea) {
                        //
                        //         return 'rgba(78, 246, 23, 1)';
                        //     }
                        //
                        //     const height  = chartArea.bottom - chartArea.top;
                        //     const zeroPos = Math.max(Math.min(Math.ceil(scales.y.getPixelForValue(0) - chartArea.top) / height, 1.0), 0);
                        //
                        //     const gradient = context.chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                        //
                        //     gradient.addColorStop(0, 'rgba(66, 228, 13, 1)');
                        //     gradient.addColorStop(zeroPos, 'rgba(94, 154, 19, 1)');
                        //     gradient.addColorStop(zeroPos, 'rgba(153, 9, 9, 1)');
                        //     gradient.addColorStop(1, 'rgba(214, 13, 13, 1)');
                        //
                        //     return gradient;
                        // }
                    }
                ]
            },
            plugins : [
                {
                    id : 'test',
                    beforeRender(chart) {

                        const { scales, chartArea } = chart;

                        if (!chartArea) {

                            return 'rgba(78, 246, 23, 1)';
                        }

                        const height  = chartArea.bottom - chartArea.top;
                        const zeroPos = Math.max(Math.min(Math.ceil(scales.y.getPixelForValue(0) - chartArea.top) / height, 1.0), 0);

                        const gradient = chart.ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

                        gradient.addColorStop(0, 'rgba(66, 228, 13, 1)');
                        gradient.addColorStop(zeroPos, 'rgba(94, 154, 19, 1)');
                        gradient.addColorStop(zeroPos, 'rgba(153, 9, 9, 1)');
                        gradient.addColorStop(1, 'rgba(214, 13, 13, 1)');

                        chart.data.datasets[0].backgroundColor                = gradient;
                        chart.config._config.data.datasets[0].backgroundColor = gradient;
                        chart.config.clearCache();
                    }
                }
            ],
            options : {
                devicePixelRatio : 2,
                animation        : false,
                elements         : {
                    point : { radius : 0 }
                },
                plugins          : {
                    legend  : { display : false },
                    tooltip : { enabled : false }
                },
                scales           : {
                    x : {
                        type  : 'time',
                        time  : { round : true },
                        title : { display : false },
                        ticks : {
                            source    : 'auto',
                            fontColor : 'rgb(128,128,128)',
                            fontSize  : 22
                        }
                    },
                    y : {
                        tile  : { display : false },
                        ticks : {
                            precision    : 0,
                            suggestedMin : 0,
                            suggestedMax : 0,
                            fontColor    : 'rgb(128,128,128)',
                            fontSize     : 22
                        }
                    }
                }
            }
        });
    }
};
