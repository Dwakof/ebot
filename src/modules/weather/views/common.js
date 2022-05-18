'use strict';

const { View }       = require('../../../core');
const { inlineCode } = require('@discordjs/builders');

module.exports = class CommonView extends View {

    static EMOJI_MAPPING = {
        day   : {
            // Thunderstorm
            200 : ':thunder_cloud_rain:',
            201 : ':thunder_cloud_rain:',
            202 : ':thunder_cloud_rain:',
            210 : ':cloud_lightning:',
            211 : ':cloud_lightning:',
            212 : ':cloud_lightning:',
            221 : ':thunder_cloud_rain:',
            230 : ':thunder_cloud_rain:',
            231 : ':thunder_cloud_rain:',
            232 : ':thunder_cloud_rain:',
            // Drizzle
            300 : ':cloud_rain:',
            301 : ':cloud_rain:',
            302 : ':cloud_rain:',
            310 : ':cloud_rain:',
            311 : ':cloud_rain:',
            312 : ':cloud_rain:',
            313 : ':cloud_rain:',
            314 : ':cloud_rain:',
            321 : ':cloud_rain:',
            // Rain
            500 : ':white_sun_rain_cloud:',
            501 : ':white_sun_rain_cloud:',
            502 : ':white_sun_rain_cloud:',
            503 : ':white_sun_rain_cloud:',
            504 : ':white_sun_rain_cloud:',
            511 : ':snowflake:',
            520 : ':cloud_rain:',
            521 : ':cloud_rain:',
            522 : ':cloud_rain:',
            531 : ':cloud_rain:',
            // Snow
            600 : ':snowflake:',
            601 : ':snowflake:',
            602 : ':snowflake:',
            611 : ':snowflake:',
            612 : ':snowflake:',
            613 : ':snowflake:',
            615 : ':snowflake:',
            616 : ':snowflake:',
            620 : ':snowflake:',
            621 : ':snowflake:',
            622 : ':snowflake:',
            // Atmosphere
            701 : ':fog:',
            711 : ':fog:',
            721 : ':fog:',
            731 : ':fog:',
            741 : ':fog:',
            751 : ':fog:',
            761 : ':fog:',
            762 : ':volcano::fog:',
            771 : ':fog:',
            781 : ':cloud_tornado:',
            // Clouds
            800 : ':sunny:',
            801 : ':white_sun_small_cloud:',
            802 : ':partly_sunny:',
            803 : ':white_sun_cloud:',
            804 : ':cloud:'
        },
        night : {
            // Thunderstorm
            200 : ':thunder_cloud_rain:',
            201 : ':thunder_cloud_rain:',
            202 : ':thunder_cloud_rain:',
            210 : ':cloud_lightning:',
            211 : ':cloud_lightning:',
            212 : ':cloud_lightning:',
            221 : ':thunder_cloud_rain:',
            230 : ':thunder_cloud_rain:',
            231 : ':thunder_cloud_rain:',
            232 : ':thunder_cloud_rain:',
            // Drizzle
            300 : ':cloud_rain:',
            301 : ':cloud_rain:',
            302 : ':cloud_rain:',
            310 : ':cloud_rain:',
            311 : ':cloud_rain:',
            312 : ':cloud_rain:',
            313 : ':cloud_rain:',
            314 : ':cloud_rain:',
            321 : ':cloud_rain:',
            // Rain
            500 : ':cloud_rain:',
            501 : ':cloud_rain:',
            502 : ':cloud_rain:',
            503 : ':cloud_rain:',
            504 : ':cloud_rain:',
            511 : ':snowflake:',
            520 : ':cloud_rain:',
            521 : ':cloud_rain:',
            522 : ':cloud_rain:',
            531 : ':cloud_rain:',
            // Snow
            600 : ':snowflake:',
            601 : ':snowflake:',
            602 : ':snowflake:',
            611 : ':snowflake:',
            612 : ':snowflake:',
            613 : ':snowflake:',
            615 : ':snowflake:',
            616 : ':snowflake:',
            620 : ':snowflake:',
            621 : ':snowflake:',
            622 : ':snowflake:',
            // Atmosphere
            701 : ':fog:',
            711 : ':fog:',
            721 : ':fog:',
            731 : ':fog:',
            741 : ':fog:',
            751 : ':fog:',
            761 : ':fog:',
            762 : ':volcano::fog:',
            771 : ':fog:',
            781 : ':cloud_tornado:',
            // Clouds
            800 : ':crescent_moon:',
            801 : ':crescent_moon',
            802 : ':cloud:',
            803 : ':cloud:',
            804 : ':cloud:'
        }
    };

    temperature(temperature) {

        const { WeatherService } = this.services();

        const celsius = WeatherService.kelvinToCelsius(temperature);

        return `${ celsius }°C (${ WeatherService.celsiusToFahrenheit(celsius) }°F)`;
    }

    speed(speed) {

        return `${ Math.round(speed * 3.6) } Km/h (${ Math.round(speed * 2.23694) } Mph)`;
    }

    location(location) {

        let strings = [`${ location.address.county || location.address.state || location.address.region || location.address.country }`];

        if (location.address.village || location.address.city) {

            strings = [`${ location.address.village || location.address.city }`, location.address.postcode, location.address.state];
        }

        if (strings[0] !== `${ location.address.country }`) {

            strings.push(location.address.country);
        }

        return strings.filter(Boolean).join(', ');
    }

    /**
     * @param {WeatherCondition} condition
     * @param {Boolean}          [day=true]
     *
     * @returns {String}
     */
    conditionToEmoji(condition, day = true) {

        if (day) {

            return CommonView.EMOJI_MAPPING.day[condition.id];
        }

        return CommonView.EMOJI_MAPPING.night[condition.id];
    }


    /**
     * @param {MessageEmbed}            embed
     * @param {Array<WeatherCondition>} conditions
     * @param {Boolean}                 [day=true]
     * @param {String}                  [title='Weather]
     *
     * @return {MessageEmbed}
     */
    condition(embed, conditions = [], day = true, title = 'Weather') {

        return embed.addField(title, conditions.map((w) => `${ this.conditionToEmoji(w, day) } ${ inlineCode(w.description) }`).join('\n'), true);
    }

    /**
     * @param {Number} phase
     *
     * @returns {String}
     */
    moon(phase) {

        return [':new_moon:', ':first_quarter_moon:', ':full_moon:', ':last_quarter_moon:', ':new_moon:'][phase * 4] || '';
    }
};
