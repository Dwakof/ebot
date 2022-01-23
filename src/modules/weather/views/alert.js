'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles } = require('@discordjs/builders');

module.exports = class WeatherAlertView extends View {

    /**
     * @param {Array<WeatherAlert>} alerts
     *
     * @return {Array<MessageEmbed>}
     */
    render(alerts) {

        return alerts.map(this.alert.bind(this));
    }

    /**
     *
     * @param {WeatherAlert} alert
     *
     * @return {MessageEmbed}
     */
    alert(alert) {

        const embed = this.embed()
            .setTitle(`${ alert.event }`)
            .setColor('#ED4245')
            .setDescription(`${ alert.description }`);

        embed.addField(`Start : ${ Time(alert.start, TimestampStyles.RelativeTime) }`, Util.BLANK_CHAR, true);
        embed.addField(`End : ${ Time(alert.end, TimestampStyles.RelativeTime) }`, Util.BLANK_CHAR, true);

        if (alert.sender_name) {

            embed.setFooter(`from ${ alert.sender_name }`);
        }

        return embed;
    }
};
