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

        return alerts.map(this.alert.bind(this));
    }

    /**
     *
     * @param {WeatherAlert} alert
     *
     * @return {EmbedBuilder}
     */
    alert(alert) {

        const embed = this.embed()
            .setTitle(`${ alert.event }`)
            .setColor('#ed4245')
            .setDescription(`${ alert.description }`)
            .addFields([
                { name : `Start : ${ Time(alert.start, TimestampStyles.RelativeTime) }`, value : Util.BLANK_CHAR, inline : true },
                { name : `End : ${ Time(alert.end, TimestampStyles.RelativeTime) }`, value : Util.BLANK_CHAR, inline : true }
            ]);

        if (alert.sender_name) {

            embed.setFooter({ text : `from ${ alert.sender_name }` });
        }

        return embed;
    }
};
