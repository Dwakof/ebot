'use strict';

const { inlineCode } = require('discord.js');

const { View, Util } = require('../../../core');

import type { EmbedBuilder } from 'discord.js';
import type { Location }     from '../services/location.cts';

interface WeatherMapping {
    desc : string;
    day : { emoji : string, icon : string };
    night : { emoji : string, icon : string };
}

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

    static WMO_MAPPING : Record<string | number, WeatherMapping> = {
        0  : { desc : 'Clear sky', day : { emoji : '☀️', icon : 'clear-day' }, night : { emoji : '🌙', icon : 'clear-night' } },
        1  : { desc : 'Mainly clear', day : { emoji : '🌤️', icon : 'partly-cloudy-day' }, night : { emoji : '☁️', icon : 'partly-cloudy-night' } },
        2  : { desc : 'Partly cloudy', day : { emoji : '⛅', icon : 'partly-cloudy-day' }, night : { emoji : '☁️', icon : 'partly-cloudy-night' } },
        3  : { desc : 'Overcast', day : { emoji : '☁️', icon : 'overcast-day' }, night : { emoji : '☁️', icon : 'overcast-night' } },
        4  : { desc : 'Visibility reduced by smoke/haze/dust', day : { emoji : '🌫️', icon : 'haze-day' }, night : { emoji : '🌫️', icon : 'haze-night' } },
        5  : { desc : 'Haze', day : { emoji : '🌫️', icon : 'haze-day' }, night : { emoji : '🌫️', icon : 'haze-night' } },
        6  : { desc : 'Widespread dust in suspension', day : { emoji : '🌫️', icon : 'dust-day' }, night : { emoji : '🌫️', icon : 'dust-night' } },
        7  : { desc : 'Dust or sand raised by wind', day : { emoji : '💨', icon : 'dust-wind' }, night : { emoji : '💨', icon : 'dust-wind' } },
        8  : { desc : 'Smoke', day : { emoji : '🌫️', icon : 'smoke' }, night : { emoji : '🌫️', icon : 'smoke' } },
        9  : { desc : 'Duststorm or sandstorm', day : { emoji : '💨', icon : 'dust' }, night : { emoji : '💨', icon : 'dust' } },
        10 : { desc : 'Mist', day : { emoji : '🌫️', icon : 'mist' }, night : { emoji : '🌫️', icon : 'mist' } },
        11 : { desc : 'Patches of mist', day : { emoji : '🌫️', icon : 'mist' }, night : { emoji : '🌫️', icon : 'mist' } },
        12 : { desc : 'More widespread mist', day : { emoji : '🌫️', icon : 'mist' }, night : { emoji : '🌫️', icon : 'mist' } },
        13 : { desc : 'Lightning visible', day : { emoji : '⚡', icon : 'lightning-bolt' }, night : { emoji : '⚡', icon : 'lightning-bolt' } },
        14 : { desc : 'Precipitation not reaching ground', day : { emoji : '☁️', icon : 'overcast' }, night : { emoji : '☁️', icon : 'overcast' } },
        15 : { desc : 'Precipitation reaching ground (type uncertain)', day : { emoji : '🌧️', icon : 'rain' }, night : { emoji : '🌧️', icon : 'rain' } },
        16 : { desc : 'Precipitation from nearby clouds', day : { emoji : '🌧️', icon : 'partly-cloudy-day-rain' }, night : { emoji : '🌧️', icon : 'partly-cloudy-night-rain' } },
        17 : { desc : 'Thunderstorm (no precipitation)', day : { emoji : '⛈️', icon : 'thunderstorms-day' }, night : { emoji : '⛈️', icon : 'thunderstorms-night' } },
        18 : { desc : 'Squalls', day : { emoji : '💨', icon : 'wind' }, night : { emoji : '💨', icon : 'wind' } },
        19 : { desc : 'Funnel cloud / tornado nearby', day : { emoji : '🌪️', icon : 'tornado' }, night : { emoji : '🌪️', icon : 'tornado' } },
        20 : { desc : 'Drizzle', day : { emoji : '🌧️', icon : 'drizzle' }, night : { emoji : '🌧️', icon : 'drizzle' } },
        21 : { desc : 'Rain', day : { emoji : '🌧️', icon : 'rain' }, night : { emoji : '🌧️', icon : 'rain' } },
        22 : { desc : 'Snow', day : { emoji : '❄️', icon : 'snow' }, night : { emoji : '❄️', icon : 'snow' } },
        23 : { desc : 'Sleet / Rain + Snow', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        24 : { desc : 'Freezing rain or drizzle', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        25 : { desc : 'Shower(s)', day : { emoji : '🌦️', icon : 'partly-cloudy-day-rain' }, night : { emoji : '🌧️', icon : 'partly-cloudy-night-rain' } },
        26 : { desc : 'Snow showers', day : { emoji : '❄️', icon : 'partly-cloudy-day-snow' }, night : { emoji : '❄️', icon : 'partly-cloudy-night-snow' } },
        27 : { desc : 'Hail', day : { emoji : '🧊', icon : 'hail' }, night : { emoji : '🧊', icon : 'hail' } },
        28 : { desc : 'Fog', day : { emoji : '🌫️', icon : 'fog-day' }, night : { emoji : '🌫️', icon : 'fog-night' } },
        29 : { desc : 'Thunderstorm with precipitation', day : { emoji : '⛈️', icon : 'thunderstorms-day-rain' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-rain' } },
        30 : { desc : 'Duststorm or Sandstorm (slight)', day : { emoji : '💨', icon : 'dust' }, night : { emoji : '💨', icon : 'dust' } },
        31 : { desc : 'Duststorm or Sandstorm (moderate)', day : { emoji : '💨', icon : 'dust' }, night : { emoji : '💨', icon : 'dust' } },
        32 : { desc : 'Duststorm or Sandstorm (severe)', day : { emoji : '💨', icon : 'dust' }, night : { emoji : '💨', icon : 'dust' } },
        33 : { desc : 'Blowing snow', day : { emoji : '❄️', icon : 'wind-snow' }, night : { emoji : '❄️', icon : 'wind-snow' } },
        34 : { desc : 'Drifting snow', day : { emoji : '❄️', icon : 'wind-snow' }, night : { emoji : '❄️', icon : 'wind-snow' } },
        35 : { desc : 'Heavy drifting snow', day : { emoji : '❄️', icon : 'wind-snow' }, night : { emoji : '❄️', icon : 'wind-snow' } },
        40 : { desc : 'Fog or ice fog', day : { emoji : '🌫️', icon : 'fog' }, night : { emoji : '🌫️', icon : 'fog' } },
        41 : { desc : 'Fog in patches', day : { emoji : '🌫️', icon : 'fog-day' }, night : { emoji : '🌫️', icon : 'fog-night' } },
        42 : { desc : 'Fog thinning', day : { emoji : '🌫️', icon : 'fog-day' }, night : { emoji : '🌫️', icon : 'fog-night' } },
        43 : { desc : 'Fog thinning in patches', day : { emoji : '🌫️', icon : 'fog-day' }, night : { emoji : '🌫️', icon : 'fog-night' } },
        44 : { desc : 'Fog, no change', day : { emoji : '🌫️', icon : 'fog' }, night : { emoji : '🌫️', icon : 'fog' } },
        45 : { desc : 'Fog thickening', day : { emoji : '🌫️', icon : 'fog' }, night : { emoji : '🌫️', icon : 'fog' } },
        48 : { desc : 'Freezing fog', day : { emoji : '🌫️', icon : 'fog-day' }, night : { emoji : '🌫️', icon : 'fog-night' } },
        50 : { desc : 'Drizzle — slight', day : { emoji : '🌧️', icon : 'drizzle' }, night : { emoji : '🌧️', icon : 'drizzle' } },
        51 : { desc : 'Drizzle — light', day : { emoji : '🌧️', icon : 'drizzle' }, night : { emoji : '🌧️', icon : 'drizzle' } },
        52 : { desc : 'Drizzle — moderate', day : { emoji : '🌧️', icon : 'drizzle' }, night : { emoji : '🌧️', icon : 'drizzle' } },
        53 : { desc : 'Drizzle — dense', day : { emoji : '🌧️', icon : 'drizzle' }, night : { emoji : '🌧️', icon : 'drizzle' } },
        54 : { desc : 'Freezing drizzle — slight', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        55 : { desc : 'Freezing drizzle — moderate/dense', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        56 : { desc : 'Freezing drizzle — light', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        57 : { desc : 'Freezing drizzle — heavy', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        60 : { desc : 'Rain — not freezing, slight', day : { emoji : '🌧️', icon : 'rain' }, night : { emoji : '🌧️', icon : 'rain' } },
        61 : { desc : 'Rain — light', day : { emoji : '🌧️', icon : 'rain' }, night : { emoji : '🌧️', icon : 'rain' } },
        62 : { desc : 'Rain — moderate', day : { emoji : '🌧️', icon : 'overcast-day-rain' }, night : { emoji : '🌧️', icon : 'overcast-night-rain' } },
        63 : { desc : 'Rain — heavy', day : { emoji : '🌧️', icon : 'overcast-day-rain' }, night : { emoji : '🌧️', icon : 'overcast-night-rain' } },
        64 : { desc : 'Freezing rain — slight', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        65 : { desc : 'Freezing rain — heavy', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        66 : { desc : 'Freezing rain — light', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        67 : { desc : 'Freezing rain — heavy', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        68 : { desc : 'Rain and snow — light', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        69 : { desc : 'Rain and snow — heavy', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        70 : { desc : 'Snow — slight', day : { emoji : '❄️', icon : 'snow' }, night : { emoji : '❄️', icon : 'snow' } },
        71 : { desc : 'Snow — light', day : { emoji : '❄️', icon : 'snow' }, night : { emoji : '❄️', icon : 'snow' } },
        72 : { desc : 'Snow — moderate', day : { emoji : '❄️', icon : 'overcast-day-snow' }, night : { emoji : '❄️', icon : 'overcast-night-snow' } },
        73 : { desc : 'Snow — heavy', day : { emoji : '❄️', icon : 'overcast-day-snow' }, night : { emoji : '❄️', icon : 'overcast-night-snow' } },
        74 : { desc : 'Snow — very heavy', day : { emoji : '❄️', icon : 'extreme-day-snow' }, night : { emoji : '❄️', icon : 'extreme-night-snow' } },
        75 : { desc : 'Snow — violent', day : { emoji : '❄️', icon : 'extreme-day-snow' }, night : { emoji : '❄️', icon : 'extreme-night-snow' } },
        76 : { desc : 'Ice pellets', day : { emoji : '🧊', icon : 'hail' }, night : { emoji : '🧊', icon : 'hail' } },
        77 : { desc : 'Snow grains', day : { emoji : '❄️', icon : 'snow' }, night : { emoji : '❄️', icon : 'snow' } },
        78 : { desc : 'Ice crystals (diamond dust)', day : { emoji : '❄️', icon : 'snowflake' }, night : { emoji : '❄️', icon : 'snowflake' } },
        80 : { desc : 'Rain shower — slight', day : { emoji : '🌦️', icon : 'partly-cloudy-day-rain' }, night : { emoji : '🌧️', icon : 'partly-cloudy-night-rain' } },
        81 : { desc : 'Rain shower — moderate', day : { emoji : '🌧️', icon : 'partly-cloudy-day-rain' }, night : { emoji : '🌧️', icon : 'partly-cloudy-night-rain' } },
        82 : { desc : 'Rain shower — heavy/violent', day : { emoji : '⛈️', icon : 'thunderstorms-day-rain' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-rain' } },
        83 : { desc : 'Sleet shower — slight', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        84 : { desc : 'Sleet shower — heavy', day : { emoji : '❄️', icon : 'sleet' }, night : { emoji : '❄️', icon : 'sleet' } },
        85 : { desc : 'Snow shower — slight', day : { emoji : '❄️', icon : 'partly-cloudy-day-snow' }, night : { emoji : '❄️', icon : 'partly-cloudy-night-snow' } },
        86 : { desc : 'Snow shower — heavy', day : { emoji : '❄️', icon : 'partly-cloudy-day-snow' }, night : { emoji : '❄️', icon : 'partly-cloudy-night-snow' } },
        90 : { desc : 'Thunderstorm (slight/moderate)', day : { emoji : '⛈️', icon : 'thunderstorms-day' }, night : { emoji : '⛈️', icon : 'thunderstorms-night' } },
        91 : { desc : 'Thunderstorm with rain — light', day : { emoji : '⛈️', icon : 'thunderstorms-day-rain' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-rain' } },
        92 : { desc : 'Thunderstorm with rain — heavy', day : { emoji : '⛈️', icon : 'thunderstorms-day-rain' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-rain' } },
        93 : { desc : 'Thunderstorm with snow', day : { emoji : '⛈️', icon : 'thunderstorms-day-snow' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-snow' } },
        94 : { desc : 'Thunderstorm with hail or ice pellets', day : { emoji : '🧊', icon : 'thunderstorms-day-extreme' }, night : { emoji : '🧊', icon : 'thunderstorms-night-extreme' } },
        95 : { desc : 'Thunderstorm', day : { emoji : '⛈️', icon : 'thunderstorms-day' }, night : { emoji : '⛈️', icon : 'thunderstorms-night' } },
        96 : { desc : 'Thunderstorm with slight hail', day : { emoji : '🧊', icon : 'thunderstorms-day-snow' }, night : { emoji : '🧊', icon : 'thunderstorms-night-snow' } },
        97 : { desc : 'Thunderstorm heavy', day : { emoji : '⛈️', icon : 'thunderstorms-day-extreme' }, night : { emoji : '⛈️', icon : 'thunderstorms-night-extreme' } },
        98 : { desc : 'Thunderstorm with duststorm/sandstorm', day : { emoji : '⛈️', icon : 'thunderstorms-day' }, night : { emoji : '⛈️', icon : 'thunderstorms-night' } },
        99 : { desc : 'Thunderstorm with heavy hail', day : { emoji : '🧊', icon : 'thunderstorms-day-extreme' }, night : { emoji : '🧊', icon : 'thunderstorms-night-extreme' } },
        NA : { desc : 'Not available', day : { emoji : '❓', icon : 'not-available' }, night : { emoji : '❓', icon : 'not-available' } }
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
    toCardinalDirection(degree : number, cardinalDirections : string[] = this.IntercardinalDirection) : string {

        const cardinalSize = 360 / cardinalDirections.length;

        return cardinalDirections[Math.floor((degree + (cardinalSize / 2)) % 360 / cardinalSize)];
    }

    /**
     * @param {number} temperature
     * @return {string}
     */
    temperature(temperature : number) : string {

        return `${ Math.round(temperature) }°C (${ Math.round(temperature * 9 / 5 + 32) }°F)`;
    }

    /**
     * @param {number} speed
     * @return {string}
     */
    speed(speed : number) : string {

        return `${ Math.round(speed * 3.6) } Km/h (${ Math.round(speed * 2.23694) } Mph)`;
    }

    location(location : Location) {

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
    aqi(aqi : number) : string {

        const idx = CommonView.AQI_THRESHOLD.length - CommonView.AQI_THRESHOLD.findIndex((t) => aqi > t);

        return `${ Util.randomValue(CommonView.AQI_TO_EMOJI[idx]) } ${ inlineCode(CommonView.AQI_DESCRIPTION[idx]) }`;
    }

    /**
     * @param {number} uvi
     * @return {string}
     */
    uvi(uvi : number) : string {

        const idx = CommonView.UVI_THRESHOLD.length - CommonView.UVI_THRESHOLD.findIndex((t) => uvi > t);

        return `:sunny: ${ inlineCode(CommonView.UVI_DESCRIPTION[idx]) } (${ uvi })`;
    }

    getCodeMapping(code : number, day : boolean = true) {

        const mapping = CommonView.WMO_MAPPING[code] ?? CommonView.WMO_MAPPING.NA;

        return day ? mapping.day : mapping.night;
    }

    wmoCodeToEmoji(code : number, day : boolean = true) : string {

        return this.getCodeMapping(code, day).emoji;
    }

    wmoCodeToIconUrl(code : number, day : boolean = true) : string {

        return `https://weather.dwakof.party/fill/${ this.getCodeMapping(code, day).icon }.webp`;
    }

    wmoCodeToDescription(code : number) : string {

        return CommonView.WMO_MAPPING[code]?.desc ?? CommonView.WMO_MAPPING.NA.desc;
    }

    wmoCodeToString(code : number, day : boolean = true) : string {

        return `${ this.wmoCodeToEmoji(code, day) } ${ inlineCode(this.wmoCodeToDescription(code)) }`;
    }

    /**
     * @param {EmbedBuilder} embed
     * @param {number}       code
     * @param {Boolean}      [day=true]
     * @param {String}       [title='Weather']
     *
     * @return {EmbedBuilder}
     */
    wmoCodeField(embed : EmbedBuilder, code : number, day : boolean = true, title : string = 'Weather') : EmbedBuilder {

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
    moon(phase : number) : string {

        return ['🌑', '🌓', '🌕', '🌗', '🌑'][phase * 4] || '';
    }
}

module.exports = CommonView;
