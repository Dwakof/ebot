'use strict';

const { View }       = require('../../../core');
const { inlineCode } = require('discord.js');

module.exports = class CommonView extends View {

    static EMOJI_MAPPING = {
        day   : {
            // Thunderstorm
            200 : '⛈', // thunderstorm with light rain
            201 : '⛈', // thunderstorm with rain
            202 : '⛈', // thunderstorm with heavy rain
            210 : '🌩', // light thunderstorm
            211 : '🌩', // thunderstorm
            212 : '🌩', // heavy thunderstorm
            221 : '⛈', // ragged thunderstorm
            230 : '⛈', // thunderstorm with light drizzle
            231 : '⛈', // thunderstorm with drizzle
            232 : '⛈', // thunderstorm with heavy drizzle
            // Drizzle
            300 : '🌧', // light intensity drizzle
            301 : '🌧', // drizzle
            302 : '🌧', // heavy intensity drizzle
            310 : '🌧', // light intensity drizzle rain
            311 : '🌧', // drizzle rain
            312 : '🌧', // heavy intensity drizzle rain
            313 : '🌧', // shower rain and drizzle
            314 : '🌧', // heavy shower rain and drizzle
            321 : '🌧', // shower drizzle
            // Rain
            500 : '🌦', // light rain
            501 : '🌦', // moderate rain
            502 : '🌦', // heavy intensity rain
            503 : '🌦', // very heavy rain
            504 : '🌦', // extreme rain
            511 : '🌨', // freezing rain
            520 : '🌧', // light intensity shower rain
            521 : '🌧', // shower rain
            522 : '🌧', // heavy intensity shower rain
            531 : '🌧', // ragged shower rain
            // Snow
            600 : '🌨', // light snow
            601 : '🌨', // snow
            602 : '🌨', // heavy snow
            611 : '🌨', // sleet
            612 : '🌨', // light shower sleet
            613 : '🌨', // shower sleet
            615 : '🌨', // light rain and snow
            616 : '🌨', // rain and snow
            620 : '🌨', // light shower snow
            621 : '🌨', // shower snow
            622 : '🌨', // heavy shower snow
            // Atmosphere
            701 : '🌫',   // mist
            711 : '🌫',   // smoke
            721 : '🌫',   // haze
            731 : '🌫',   // sand, dust whirls
            741 : '🌫',   // fog
            751 : '🌫',   // sand
            761 : '🌫',   // dust
            762 : '🌋🌫', // volcanic ash
            771 : '🌫',   // squalls
            781 : '🌪',   // tornado
            // Clouds
            800 : '☀', // clear sky
            801 : '🌤', // few clouds
            802 : '⛅', // scattered clouds
            803 : '🌥', // broken clouds
            804 : '☁' // overcast clouds
        },
        night : {
            // Thunderstorm
            200 : '⛈', // thunderstorm with light rain
            201 : '⛈', // thunderstorm with rain
            202 : '⛈', // thunderstorm with heavy rain
            210 : '🌩', // light thunderstorm
            211 : '🌩', // thunderstorm
            212 : '🌩', // heavy thunderstorm
            221 : '⛈', // ragged thunderstorm
            230 : '⛈', // thunderstorm with light drizzle
            231 : '⛈', // thunderstorm with drizzle
            232 : '⛈', // thunderstorm with heavy drizzle
            // Drizzle
            300 : '🌧', // light intensity drizzle
            301 : '🌧', // drizzle
            302 : '🌧', // heavy intensity drizzle
            310 : '🌧', // light intensity drizzle rain
            311 : '🌧', // drizzle rain
            312 : '🌧', // heavy intensity drizzle rain
            313 : '🌧', // shower rain and drizzle
            314 : '🌧', // heavy shower rain and drizzle
            321 : '🌧', // shower drizzle
            // Rain
            500 : '🌦', // light rain
            501 : '🌦', // moderate rain
            502 : '🌦', // heavy intensity rain
            503 : '🌦', // very heavy rain
            504 : '🌦', // extreme rain
            511 : '🌨', // freezing rain
            520 : '🌧', // light intensity shower rain
            521 : '🌧', // shower rain
            522 : '🌧', // heavy intensity shower rain
            531 : '🌧', // ragged shower rain
            // Snow
            600 : '🌨', // light snow
            601 : '🌨', // snow
            602 : '🌨', // heavy snow
            611 : '🌨', // sleet
            612 : '🌨', // light shower sleet
            613 : '🌨', // shower sleet
            615 : '🌨', // light rain and snow
            616 : '🌨', // rain and snow
            620 : '🌨', // light shower snow
            621 : '🌨', // shower snow
            622 : '🌨', // heavy shower snow
            // Atmosphere
            701 : '🌫',   // mist
            711 : '🌫',   // smoke
            721 : '🌫',   // haze
            731 : '🌫',   // sand, dust whirls
            741 : '🌫',   // fog
            751 : '🌫',   // sand
            761 : '🌫',   // dust
            762 : '🌋🌫', // volcanic ash
            771 : '🌫',   // squalls
            781 : '🌪',   // tornado
            // Clouds
            800 : '🌙', // clear sky
            801 : '🌙', // few clouds
            802 : '☁', // scattered clouds
            803 : '☁', // broken clouds
            804 : '☁' // overcast clouds
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
     * @param {EmbedBuilder}            embed
     * @param {Array<WeatherCondition>} conditions
     * @param {Boolean}                 [day=true]
     * @param {String}                  [title='Weather]
     *
     * @return {EmbedBuilder}
     */
    condition(embed, conditions = [], day = true, title = 'Weather') {

        return embed.addFields([
            {
                name   : title,
                value  : conditions.map((w) => `${ this.conditionToEmoji(w, day) } ${ inlineCode(w.description) }`).join('\n'),
                inline : true
            }
        ]);
    }

    /**
     * @param {Number} phase
     *
     * @returns {String}
     */
    moon(phase) {

        return ['🌑', '🌓', '🌕', '🌗', '🌑'][phase * 4] || '';
    }
};
