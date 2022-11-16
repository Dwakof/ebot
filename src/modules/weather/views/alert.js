'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles } = require('discord.js');

module.exports = class WeatherAlertView extends View {

    /**
     * @param {Array<WeatherAlert>} alerts
     *
     * @return {Array<EmbedBuilder>}
     */
    render(alerts) {

        return alerts.map(this.alert.bind(this)).flat(1);
    }

    /**
     *
     * @param {WeatherAlert} alert
     *
     * @return {Array<EmbedBuilder>}
     */
    alert(alert) {

        const mainEmbed = this.embed()
            .setTitle(`${ alert.event }`)
            .setColor('#ed4245')
            .addFields([
                { name : `Start : ${ Time(alert.start, TimestampStyles.RelativeTime) }`, value : Util.BLANK_CHAR, inline : true },
                { name : `End : ${ Time(alert.end, TimestampStyles.RelativeTime) }`, value : Util.BLANK_CHAR, inline : true }
            ]);

        if (alert.sender_name) {

            mainEmbed.setFooter({ text : `from ${ alert.sender_name }` });
        }

        if (alert.description.length <= 3500) {

            mainEmbed.setDescription(`${ alert.description }`);

            return [mainEmbed];
        }

        if (alert.description.length <= 5000) {

            const blocks = Util.paragraphText(alert.description, 1000);

            mainEmbed.addFields(blocks.map((block) => ({ name : Util.BLANK_CHAR, value : block.trim(), input : false })));

            return [mainEmbed];
        }

        const blocks = Util.paragraphText(alert.description, 4000);

        mainEmbed.setDescription(`${ blocks.shift() }`);

        const extraEmbeds = [];

        for (const block of blocks) {

            extraEmbeds.push(this.embed().setColor('#ed4245').setDescription(`${ block }`));
        }

        return [mainEmbed, ...extraEmbeds];
    }
};
