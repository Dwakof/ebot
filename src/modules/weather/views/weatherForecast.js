'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles, inlineCode } = require('discord.js');

module.exports = class WeatherForecastView extends View {

    /**
     * @param {import('../services/weather.cts').WeatherData} weather
     * @param {import('../services/location.cts').Location}   location
     * @param {number}                                        [maxDays=5]
     *
     * @return {import('discord.js').EmbedBuilder}
     */
    daily(weather, location, maxDays = 5) {

        const { CommonView } = this.views();

        const embed = this.embed().setTitle(CommonView.location(location)).setTimestamp();

        embed.setDescription(Util.BLANK_CHAR);

        for (const day of weather.daily.slice(0, maxDays)) {

            this.weather(embed, day);
            this.temperature(embed, day, Util.BLANK_CHAR);
            this.air(embed, day, Util.BLANK_CHAR);
        }

        return embed;
    }

    /**
     * @param {import('discord.js').EmbedBuilder}                  embed
     * @param {import('../services/weather.cts').DailyWeatherData} day
     * @return {import('discord.js').EmbedBuilder}
     */
    weather(embed, day) {

        const { CommonView } = this.views();

        return embed.addFields([
            {
                name   : Time(day.day, TimestampStyles.LongDate),
                value  : [
                    `${ Time(day.sunrise, TimestampStyles.ShortTime) } ➞ ${ Time(day.sunset, TimestampStyles.ShortTime) }`,
                    CommonView.wmoCodeToString(day.code)
                ].join('\n'),
                inline : true
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}                  embed
     * @param {import('../services/weather.cts').DailyWeatherData} day
     * @param {string}                                             [title]
     * @return {import('discord.js').EmbedBuilder}
     */
    temperature(embed, day, title = 'Temperature') {

        const { CommonView } = this.views();

        return embed.addFields([
            {
                name   : title,
                value  : [
                    `:thermometer: ${ inlineCode(`${ CommonView.temperature(day.temperature.min) }, ${ CommonView.temperature(day.temperature.max) }`) }`,
                    `:dash: ${ inlineCode(`${ CommonView.temperature(day.apparentTemperature.min) }, ${ CommonView.temperature(day.apparentTemperature.max) }`) }`
                ].join('\n'),
                inline : true
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}                  embed
     * @param {import('../services/weather.cts').DailyWeatherData} day
     * @param {string}                                             [title]
     * @return {import('discord.js').EmbedBuilder}
     */
    air(embed, day, title = 'Air') {

        const { CommonView }     = this.views();

        const rows = [];

        if (day.humidity) {

            rows.push(`:droplet: ${ inlineCode(`${ Math.round(day.humidity) } %`.padStart(5, ' ')) } ${ inlineCode(`${ Math.round(day.pressure) } hPa`) }`);
        }

        if (day.wind.speed === 0) {

            rows.push(`:wind_chime: ${ inlineCode('no wind') }`);
        }
        else {

            rows.push(`:wind_chime: ${ inlineCode(`${ CommonView.speed(day.wind.speed) } ${ CommonView.toCardinalDirection(day.wind.direction) }`) }`);
        }

        if (day.wind.gusts) {

            rows.push(`:dash: ${ inlineCode(CommonView.speed(day.wind.gusts)) }`);
        }

        rows.push(Util.BLANK_CHAR);

        return embed.addFields([{ name : title, value : rows.join('\n'), inline : true }]);
    }
};
