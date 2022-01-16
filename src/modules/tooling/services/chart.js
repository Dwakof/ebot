'use strict';

const Hoek = require('@hapi/hoek');

// const { Canvas } = require('skia-canvas');
const Canvas = require('canvas');

const { Chart }                           = require('chart.js');
const ChartJSLuxon                        = require('chartjs-adapter-luxon');
const { MatrixController, MatrixElement } = require('../../../../lib/chartjs-matrix');

const { Service } = require('../../../core');

module.exports = class ChartService extends Service {

    init() {

        this.chartJS = Chart;

        this.chartJS.register(ChartJSLuxon);
        this.chartJS.register(MatrixController, MatrixElement);
    }

    /**
     * @param {Number} width
     * @param {Number} height
     * @param {Object} configuration
     *
     * @return {Object}
     */
    renderGraph({ width, height, ...configuration } = {}) {

        // const canvas = new Canvas(width, height);
        const canvas = Canvas.createCanvas(width, height);

        configuration.options            = configuration.options ?? {};
        configuration.options.scales     = configuration.options.scales ?? {};
        configuration.options.responsive = false;
        configuration.options.annimation = false;

        // for (const scale of Object.values(configuration.options.scales)) {
        //
        //     // A weird patch, because sometimes borderDashOffset or tickBorderDashOffset is not defined, and it causes an error with Skia, so I am just forcing the default value
        //
        //     scale.grid                      = scale.grid ?? {};
        //     scale.grid.borderDashOffset     = scale.grid.borderDashOffset ?? 0.0;
        //     scale.grid.tickBorderDashOffset = scale.grid.tickBorderDashOffset ?? scale.grid.borderDashOffset;
        // }

        const context = canvas.getContext('2d');

        return { chart : new this.chartJS(context, configuration), canvas, context };
    }

    /**
     * @param {Object}  configuration
     * @param {String}  [mine]
     * @param {Object}  [options={}]
     * @param {Number}  options.page
     * @param {String}  options.matte
     * @param {Number}  options.density
     * @param {Number}  options.quality
     * @param {Boolean} options.outline
     *
     * @returns {Promise<Buffer>}
     */
    renderToBuffer(configuration, mine, options = {}) {

        const { canvas } = this.renderGraph(configuration);

        return new Promise((fulfil, reject) => {

            canvas.toBuffer((error, buffer) => {

                if (error) {

                    return reject(error);
                }

                fulfil(buffer);
            });
        });
    }

    /**
     * @param {Object}  configuration
     * @param {String}  [mine]
     * @param {Object}  [options={}]
     * @param {Number}  options.page
     * @param {String}  options.matte
     * @param {Number}  options.density
     * @param {Number}  options.quality
     * @param {Boolean} options.outline
     *
     * @returns {String}
     */
    renderToDataURL(configuration, mine, options = {}) {

        const { canvas } = this.renderGraph(configuration);

        return canvas.toDataURL(mine, options.quality);
    }

    linearVerticalSplitAtZeroBackgroundColorGradient(colorHigh, colorHighZero, colorLowZero, colorLow) {

        colorHigh     = colorHigh ?? 'rgba(66, 228, 13, 1)';
        colorHighZero = colorHighZero ?? 'rgba(94, 154, 19, 1)';
        colorLowZero  = colorLowZero ?? 'rgba(153, 9, 9, 1)';
        colorLow      = colorLow ?? 'rgba(214, 13, 13, 1)';

        return function (context) {

            const { scales, chartArea } = context.chart;

            if (!chartArea) {

                return colorHigh;
            }

            const { top, bottom } = chartArea;

            const zeroPos = Math.max(Math.min(Math.ceil(scales.y.getPixelForValue(0) - top) / (bottom - top), 1.0), 0);

            const gradient = context.chart.ctx.createLinearGradient(0, top, 0, bottom);

            gradient.addColorStop(0, colorHigh);
            gradient.addColorStop(zeroPos, colorHighZero);
            gradient.addColorStop(zeroPos, colorLowZero);
            gradient.addColorStop(1, colorLow);

            return gradient;
        };
    }

    /**
     * @param {Array<Array<Number|String>>} colors - An array of colors, where each color is an array of the offset and the color
     *
     * @example
     * ChartService.linearVerticalBackgroundColorGradient([[0, '#123456'], [0.5, '#abcdef'], [1, '#ffffff']])
     *
     * @return {Function}
     */
    linearVerticalBackgroundColorGradient(colors) {

        return function (context) {

            const { chartArea } = context.chart;

            if (!chartArea) {

                return colors[0][1];
            }

            const { top, bottom } = chartArea;

            const gradient = context.chart.ctx.createLinearGradient(0, top, 0, bottom);

            for (const [offset, color] of colors) {

                gradient.addColorStop(offset, color);
            }

            return gradient;
        };
    }

    /**
     * @param {Array<Array<Number|String>>} colors - An array of colors, where each color is an array of the offset and the color
     *
     * @example
     * ChartService.radialBackgroundColorGradient([[0, '#123456'], [0.5, '#abcdef'], [1, '#ffffff']])
     *
     * @return {Function}
     */
    radialBackgroundColorGradient(colors) {

        return function (context) {

            const { chartArea } = context.chart;

            if (!chartArea) {

                return colors[0][1];
            }

            const { top, right, bottom, left } = chartArea;

            const x = (left + right) / 2;
            const y = (top + bottom) / 2;
            const r = Math.min((right - left) / 2, (bottom - top) / 2);

            const gradient = context.chart.ctx.createRadialGradient(x, y, 0, x, y, r);

            for (const [offset, color] of colors) {

                gradient.addColorStop(offset, color);
            }

            return gradient;
        };
    }

    basicTicksConfig(merge = {}) {

        return Hoek.merge({
            display         : true,
            maxRotation     : 0,
            padding         : 10,
            align           : 'center',
            font            : { size : 28, weight : 600 },
            color           : 'rgb(235,235,235)',
            textStrokeColor : 'rgb(30,30,30)',
            textStrokeWidth : 0
        }, merge);
    }

    basicTimeSeriesScales(merge = {}) {

        return Hoek.merge({
            x : {
                type  : 'time',
                time  : { round : true, stepSize : 4 },
                title : { display : false },
                ticks : this.basicTicksConfig({ source : 'auto' })
            },
            y : {
                tile  : { display : false },
                ticks : this.basicTicksConfig({ precision : 0 })
            }
        }, merge);
    }
};
