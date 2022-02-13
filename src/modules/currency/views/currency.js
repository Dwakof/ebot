'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Constants : { Colors } } = require('discord.js');

const { inlineCode } = require('@discordjs/builders');

const { View } = require('../../../core');

module.exports = class CurrencyView extends View {

    /**
     * @param {Currency} from
     * @param {Currency} to
     * @param {Number}   amount
     * @param {Array}    stats
     *
     * @return {Promise<{embeds: MessageEmbed[], files: MessageAttachment[]}>}
     */
    async history(from, to, amount, stats) {

        const { ChartService }    = this.services('tooling');
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
                        backgroundColor : embed.hexColor,
                        borderColor     : embed.hexColor,
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
                        grid  : { display : true, drawOnChartArea : true, drawBorder : false, color : 'rgb(235,235,235)', borderWidth : 1 }
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
     * @return {MessageEmbed}
     */
    list(currencies) {

        const lines = [];

        for (const { code, currency, symbol } of currencies) {

            lines.push(`${ inlineCode(code) } : ${ currency } (${ inlineCode(symbol) })`);
        }

        return this.embed().setDescription(lines.join('\n'));
    }

    currencyNotFound(text) {

        return this.embed().setColor(Colors.RED).setDescription(`Currency "${ text }" not found.`);
    }
};
