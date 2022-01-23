'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles, inlineCode } = require('@discordjs/builders');

module.exports = class WeatherForecastView extends View {

    /**
     * @param {Array<WeatherForecastDay>} daily
     * @param {Location}                  location
     * @param {Number}                    [maxDays=5]
     *
     * @return {MessageEmbed}
     */
    daily(daily, location, maxDays = 5) {

        const { CommonView } = this.views();

        const embed = this.embed().setTitle(CommonView.location(location)).setTimestamp();

        embed.setDescription(Util.BLANK_CHAR);

        for (const day of daily.slice(0, maxDays)) {

            this.weather(embed, day);
            this.temperature(embed, day, Util.BLANK_CHAR);
            this.air(embed, day, Util.BLANK_CHAR);
        }

        return embed;
    }

    weather(embed, day = {}) {

        const { CommonView } = this.views();

        const { sunrise, sunset, dt, weather = [], moon_phase } = day;

        const rows = [];

        rows.push(`${ Time(sunrise, TimestampStyles.ShortTime) } ➞ ${ Time(sunset, TimestampStyles.ShortTime) }`);

        for (const w of weather) {

            rows.push(`${ CommonView.conditionToEmoji(w, true) } ${ inlineCode(w.description) }`);
        }

        return embed.addField(`${ Time(dt, TimestampStyles.LongDate) } ${ CommonView.moon(moon_phase ?? -1) }`, rows.join('\n'), true);
    }

    temperature(embed, day, title = 'Temperature') {

        const { CommonView } = this.views();

        const { temp, feels_like } = day;

        return embed.addField(title, [
            `:thermometer: ${ inlineCode(`${ CommonView.temperature(temp.min) }, ${ CommonView.temperature(temp.max) }`) }`,
            `:dash: ${ inlineCode(`${ CommonView.temperature(feels_like.morn) }, ${ CommonView.temperature(feels_like.eve) }`) }`
        ].join('\n'), true);
    }

    air(embed, day, title = 'Air') {

        const { CommonView }     = this.views();
        const { WeatherService } = this.services();

        const { humidity, pressure, wind_speed = 0, wind_deg = -1, wind_gust = 0 } = day;

        const rows = [];

        if (humidity) {
            rows.push(`:droplet: ${ inlineCode(`${ humidity } %`.padStart(5, ' ')) } ${ inlineCode(`${ pressure } hPa`) }`);
        }

        if (!wind_speed) {

            rows.push(`:wind_chime: ${ inlineCode('no wind') }`);
        }
        else {

            rows.push(`:wind_chime: ${ inlineCode(`${ CommonView.speed(wind_speed) } ${ WeatherService.toDirection(wind_deg) }`) }`);
        }

        if (wind_gust) {
            rows.push(`:dash: ${ inlineCode(CommonView.speed(wind_gust)) }`);
        }

        rows.push(Util.BLANK_CHAR);

        return embed.addField(title, rows.join('\n'), true);
    }
};
