'use strict';

const { inlineCode } = require('discord.js');

const { View, Util } = require('../../../core');

class CommonView extends View {

    static AQI_THRESHOLD   = [100, 80, 60, 40, 20, 0];
    static AQI_DESCRIPTION = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor', 'Extremely poor'];
    static AQI_TO_EMOJI    = [
        ['🌳', '🌲', '🌴', '🎋'],
        ['🙂'],
        ['😐'],
        ['🙁'],
        ['😷'],
        ['🧟']
    ];

    static UVI_THRESHOLD   = [11, 8, 6, 3, 0];
    static UVI_DESCRIPTION = ['Low', 'Moderate', 'High', 'Very High', 'Extreme'];

    static WME_MAPPING = {
        0  : { owm : '01', emoji : { day : '☀', night : '🌙' }, description : { day : 'Sunny', night : 'Clear' } },
        1  : { owm : '01', emoji : { day : '🌤', night : '🌙' }, description : { day : 'Mainly Sunny', night : 'Mainly Clear' } },
        2  : { owm : '02', emoji : { day : '⛅', night : '☁' }, description : { day : 'Partly Cloudy', night : 'Partly Cloudy' } },
        3  : { owm : '03', emoji : { day : '☁', night : '☁' }, description : { day : 'Cloudy', night : 'Cloudy' } },
        45 : { owm : '50', emoji : { day : '🌫', night : '🌫' }, description : { day : 'Foggy', night : 'Foggy' } },
        48 : { owm : '50', emoji : { day : '🌫', night : '🌫' }, description : { day : 'Rime Fog', night : 'Rime Fog' } },
        51 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Light Drizzle', night : 'Light Drizzle' } },
        53 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Drizzle', night : 'Drizzle' } },
        55 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Heavy Drizzle', night : 'Heavy Drizzle' } },
        56 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Light Freezing Drizzle', night : 'Light Freezing Drizzle' } },
        57 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Freezing Drizzle', night : 'Freezing Drizzle' } },
        61 : { owm : '10', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Light Rain', night : 'Light Rain' } },
        63 : { owm : '10', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Rain', night : 'Rain' } },
        65 : { owm : '10', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Heavy Rain', night : 'Heavy Rain' } },
        66 : { owm : '10', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Light Freezing Rain', night : 'Light Freezing Rain' } },
        67 : { owm : '10', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Freezing Rain', night : 'Freezing Rain' } },
        71 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Light Snow', night : 'Light Snow' } },
        73 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Snow', night : 'Snow' } },
        75 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Heavy Snow', night : 'Heavy Snow' } },
        77 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Snow Grains', night : 'Snow Grains' } },
        80 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Light Showers', night : 'Light Showers' } },
        81 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Showers', night : 'Showers' } },
        82 : { owm : '09', emoji : { day : '🌧', night : '🌧' }, description : { day : 'Heavy Showers', night : 'Heavy Showers' } },
        85 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Light Snow Showers', night : 'Light Snow Showers' } },
        86 : { owm : '13', emoji : { day : '🌨', night : '🌨' }, description : { day : 'Snow Showers', night : 'Snow Showers' } },
        95 : { owm : '11', emoji : { day : '🌩', night : '🌩' }, description : { day : 'Thunderstorm', night : 'Thunderstorm' } },
        96 : { owm : '11', emoji : { day : '⛈', night : '⛈' }, description : { day : 'Light Thunderstorms With Hail', night : 'Light Thunderstorms With Hail' } },
        99 : { owm : '11', emoji : { day : '⛈', night : '⛈' }, description : { day : 'Thunderstorm With Hail', night : 'Thunderstorm With Hail' } }
    };

    CardinalDirection        = ['N', 'E', 'S', 'W'];
    IntercardinalDirection   = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    SixteenCardinalDirection = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    /**
     * @param {number}   degree
     * @param {string[]} [cardinalDirections]
     *
     * @return {string}
     */
    toCardinalDirection(degree, cardinalDirections = this.IntercardinalDirection) {

        const cardinalSize = 360 / cardinalDirections.length;

        return cardinalDirections[Math.floor((degree + (cardinalSize / 2)) % 360 / cardinalSize)];
    }

    /**
     * @param {number} temperature
     * @return {string}
     */
    temperature(temperature) {

        return `${ Math.round(temperature) }°C (${ Math.round(temperature * 9 / 5 + 32) }°F)`;
    }

    /**
     * @param {number} speed
     * @return {string}
     */
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
     * @param {number} aqi
     * @return {string}
     */
    aqi(aqi) {

        const idx = CommonView.AQI_THRESHOLD.length - CommonView.AQI_THRESHOLD.findIndex((t) => aqi > t);

        return `${ Util.randomValue(CommonView.AQI_TO_EMOJI[idx]) } ${ inlineCode(CommonView.AQI_DESCRIPTION[idx]) }`;
    }

    /**
     * @param {number} uvi
     * @return {string}
     */
    uvi(uvi) {

        const idx = CommonView.UVI_THRESHOLD.length - CommonView.UVI_THRESHOLD.findIndex((t) => uvi > t);

        return `:sunny: ${ inlineCode(CommonView.UVI_DESCRIPTION[idx]) } (${ uvi })`;
    }

    /**
     * @param {number}  code
     * @param {boolean} [day=true]
     *
     * @returns {string}
     */
    wmoCodeToEmoji(code, day = true) {

        if (day) {

            return CommonView.WME_MAPPING[code].emoji.day;
        }

        return CommonView.WME_MAPPING[code].emoji.night;
    }

    /**
     * @param {number}  code
     * @param {boolean} [day=true]
     * @param {string}  [size='4x']
     *
     * @returns {string}
     */
    wmoCodeToIconUrl(code, day = true, size = '4x') {

        return `https://openweathermap.org/img/wn/${ CommonView.WME_MAPPING[code].owm }${ day ? 'd' : 'n' }@${ size }.png`;
    }

    /**
     * @param {number}  code
     * @param {boolean} [day=true]
     *
     * @return {string}
     */
    wmoCodeToDescription(code, day = true) {

        if (day) {

            return CommonView.WME_MAPPING[code].description.day;
        }

        return CommonView.WME_MAPPING[code].description.night;
    }

    /**
     * @param {number}  code
     * @param {Boolean} [day=true]
     *
     * @return {string}
     */
    wmoCodeToString(code, day = true) {

        return `${ this.wmoCodeToEmoji(code, day) } ${ inlineCode(this.wmoCodeToDescription(code, day)) }`;
    }

    /**
     * @param {EmbedBuilder} embed
     * @param {number}       code
     * @param {Boolean}      [day=true]
     * @param {String}       [title='Weather']
     *
     * @return {EmbedBuilder}
     */
    wmoCodeField(embed, code, day = true, title = 'Weather') {

        return embed.addFields([
            {
                name   : title,
                value  : this.wmoCodeToString(code, day),
                inline : true
            }
        ]);
    }

    /**
     * @param {number} phase
     *
     * @returns {string}
     */
    moon(phase) {

        return ['🌑', '🌓', '🌕', '🌗', '🌑'][phase * 4] || '';
    }
}

module.exports = CommonView;
