'use strict';

const { v4 : Uuidv4 } = require('uuid');

// eslint-disable-next-line no-unused-vars
const { MessageAttachment } = require('discord.js');

const { View } = require('../../../core');

module.exports = class HeatmapView extends View {

    /**
     * @param {Array<string|number>}                                            xLabels
     * @param {Array<string|number>}                                            yLabels
     * @param {Array<{ x : string|number, y : string|number, value : number }>} data
     * @param {Object}                                                          options
     *
     * @return {Promise<{ attachment : MessageAttachment, image : string }>}
     */
    async render(xLabels, yLabels, data, options = {}) {

        const { scale = 'Discord', padding = 10, borderRadius = 8, borderWidth = 3, width = 1600, height = 500, id = Uuidv4() } = options;

        const { ChartService } = this.client.services('chart');

        const max = data.reduce((acc, { value }) => Math.max(acc, value), 0);

        const colors = this.client.util.color.scale(scale).domain([0, max]);

        const buffer = await ChartService.renderToBuffer({
            width, height,
            type    : 'matrix',
            data    : {
                datasets : [
                    {
                        data,
                        borderRadius,
                        borderWidth,
                        borderColor : 'rgba(255,255,255,0.05)',
                        width       : ({ chart }) => (chart.chartArea || {}).width / xLabels.length - padding + 1,
                        height      : ({ chart }) => (chart.chartArea || {}).height / yLabels.length - padding,
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
                        labels  : yLabels,
                        offset  : true,
                        reverse : false,
                        left    : 'left',
                        ticks   : ChartService.basicTicksConfig(),
                        grid    : { display : false, drawBorder : false },
                        title   : { display : false }
                    },
                    x : {
                        type     : 'category',
                        labels   : xLabels,
                        offset   : true,
                        position : 'bottom',
                        ticks    : ChartService.basicTicksConfig(),
                        grid     : { display : false, drawBorder : false },
                        title    : { display : false }
                    }
                }
            }
        });

        return { image : `attachment://${ id }.png`, attachment : this.client.util.attachment(buffer, `${ id }.png`) };
    }
};
