'use strict';

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, AttachmentBuilder, Colors } = require('discord.js');

const { inlineCode } = require('discord.js');

const { View, Util } = require('../../../core');

module.exports = class CurrencyView extends View {

    /**
     * @param {Currency} from
     * @param {Currency} to
     * @param {Number}   amount
     * @param {Array}    stats
     *
     * @return {Promise<{embeds: EmbedBuilder[], files: AttachmentBuilder[]}>}
     */
    async history(from, to, amount, stats) {

        const { ChartService }    = this.services('core');
        const { CurrencyService } = this.services();

        const embed = this.embed().setTitle(`Conversion rates for ${ CurrencyService.format(amount, from) } ${ from.currency } to ${ to.currency }`);

        const buffer = await ChartService.renderToBuffer({
            width   : 1200,
            height  : 600,
            type    : 'line',
            data    : {
                datasets : [
                    {
                        label           : 'rate',
                        backgroundColor : Util.embedHexColor(embed),
                        borderColor     : Util.embedHexColor(embed),
                        stepped         : true,
                        pointRadius     : 0,
                        parsing         : false,
                        normalized      : true,
                        data            : stats.map(({ time, value }) => ({ x : time.getTime(), y : value }))
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : ChartService.basicTimeSeriesScales({
                    x : { time : { stepSize : 2 }, grid : { display : false } },
                    y : {
                        ticks : { callback : (value) => CurrencyService.format(value, to), precision : 2 },
                        grid  : { display : true, drawOnChartArea : true, color : 'rgb(235,235,235)', border : { display : false, width : 1 } }
                    }
                })
            }
        });

        embed.setImage('attachment://chart.png');

        return { embeds : [embed], files : [this.client.util.attachment(buffer, 'chart.png')] };
    }

    /**
     * @param {Array<Currency>} currencies
     *
     * @return {EmbedBuilder}
     */
    list(currencies) {

        const lines = [];

        for (const { code, currency, symbol } of currencies) {

            lines.push(`${ inlineCode(code) } : ${ currency } (${ inlineCode(symbol) })`);
        }

        return this.embed().setDescription(lines.join('\n'));
    }

    currencyNotFound(text) {

        return this.embed().setColor(Colors.Red).setDescription(`Currency "${ text }" not found.`);
    }
};
