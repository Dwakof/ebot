'use strict';

const Hoek = require('@hapi/hoek');

const { Service } = require('../../../core');

module.exports = class ChartService extends Service {

    async init() {

        const { Chart, controllers, elements, plugins, scales } = await import('chart.js');

        Chart.defaults.font.family = `'Noto Sans', 'Roboto', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`;

        Chart.register(...Object.values(controllers));
        Chart.register(...Object.values(elements));
        Chart.register(...Object.values(plugins));
        Chart.register(...Object.values(scales));

        const { MatrixController, MatrixElement } = await import('chartjs-chart-matrix');

        Chart.register(MatrixController, MatrixElement);

        await import('chartjs-adapter-luxon');

        this.chartJS = Chart;
    }

    /**
     * @param {Number} width
     * @param {Number} height
     * @param {Object} configuration
     *
     * @return {{canvas: CanvasObject, chart}}
     */
    renderGraph({ width, height, ...configuration } = {}) {

        const { CanvasService } = this.services();

        const canvas = CanvasService.getCanvas(width, height);

        configuration.options            = configuration.options ?? {};
        configuration.options.scales     = configuration.options.scales ?? {};
        configuration.options.responsive = false;
        configuration.options.annimation = false;

        const context = canvas.getContext('2d');

        return { chart : new this.chartJS(context, configuration), canvas };
    }

    /**
     * @param {Object}       configuration
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @returns {Promise<Buffer>}
     */
    renderToBuffer(configuration, format, options) {

        const { CanvasService } = this.services();

        const { canvas } = this.renderGraph(configuration);

        return CanvasService.toBuffer(canvas, format, options);
    }

    /**
     * @param {Object}  configuration
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @returns {Promise<String>}
     */
    renderToDataURL(configuration, format, options) {

        const { CanvasService } = this.services();

        const { canvas } = this.renderGraph(configuration);

        return CanvasService.toDataURL(canvas, format, options);
    }

    /**
     * @param {Object}       configuration
     * @param {ImageFormat}  [format]
     * @param {ImageOptions} [options]
     *
     * @returns {Promise<String>}
     */
    async renderAndUpload(configuration, format = 'webp', options = null) {

        const { UploadService } = this.services();

        const buffer = await this.renderToBuffer(configuration, format, options);

        return UploadService.upload(buffer, { contentType : `image/${ format }` });
    }

    linearVerticalSplitAtZeroBackgroundColorGradient(colorHigh, colorHighZero, colorLowZero, colorLow) {

        colorHigh     = colorHigh ?? 'rgba(66, 228, 13, 1)';
        colorHighZero = colorHighZero ?? 'rgba(94, 154, 19, 1)';
        colorLowZero  = colorLowZero ?? 'rgba(153, 9, 9, 1)';
        colorLow      = colorLow ?? 'rgba(214, 13, 13, 1)';

        let gradient = null;

        return function (context) {

            if (gradient) {

                return gradient;
            }

            const { scales, chartArea } = context.chart;

            if (!chartArea) {

                return colorHigh;
            }

            const { top, bottom } = chartArea;

            const zeroPos = Math.max(Math.min(Math.ceil(scales.y.getPixelForValue(0) - top) / (bottom - top), 0.99999), 0.00001);

            gradient = context.chart.ctx.createLinearGradient(0, top, 0, bottom);

            gradient.addColorStop(0, colorHigh);
            gradient.addColorStop(zeroPos, colorHighZero);
            gradient.addColorStop(zeroPos + 0.000001, colorLowZero);
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
