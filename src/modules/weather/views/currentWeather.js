'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles, inlineCode } = require('@discordjs/builders');
const { isNumber }                                 = require('chart.js/helpers');

module.exports = class CurrentWeatherView extends View {

    /**
     *
     * @param {OneCallCurrentWeather} current
     * @param {AirQuality}            airQuality
     * @param {Location}              location
     */
    render(current, airQuality, location) {

        const { CommonView } = this.views();

        const embed = this.embed()
            .setTitle(CommonView.location(location))
            .setTimestamp(current.dt * 1000);

        const { sunrise, sunset, dt } = current;

        const day = sunrise < dt && dt < sunset;

        if (current?.weather?.length > 0) {

            CommonView.condition(embed, current.weather, day);
            this.weatherIcon(embed, current.weather[0], day);
        }
        else {

            this.emptyRow(embed);
        }

        this.sun(embed, current);
        this.temperature(embed, current);

        this.wind(embed, current);
        this.humidityPressure(embed, current);
        this.airQualityUVIndex(embed, current, airQuality);

        return embed;
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {WeatherCondition}      condition
     * @param {Boolean}               [day=true]
     *
     * @return {MessageEmbed}
     */
    weatherIcon(embed, condition, day = true) {

        const { WeatherService } = this.services();

        return embed.setThumbnail(WeatherService.iconURL(condition.icon.slice(0, -1), day));
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {MessageEmbed}
     */
    sun(embed, current) {

        const { sunrise, sunset } = current;

        return embed.addField('Sunrise/Sunset', [
            `:city_sunrise: ${ Time(sunrise, TimestampStyles.RelativeTime) }`,
            `:night_with_stars: ${ Time(sunset, TimestampStyles.RelativeTime) }`
        ].join('\n'), true);
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {MessageEmbed}
     */
    temperature(embed, current) {

        const { CommonView } = this.views();

        return embed.addField('Temps/Feels like', [
            `:thermometer: ${ CommonView.temperature(current.temp) }`,
            `:dash: ${ CommonView.temperature(current.feels_like) }`
        ].join('\n'), true);
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {MessageEmbed}
     */
    wind(embed, current) {

        const { CommonView }     = this.views();
        const { WeatherService } = this.services();

        if (current.wind_speed === 0) {

            return embed.addField('Wind/Gust', `:wind_chime: ${ inlineCode('no wind') }`, true);
        }

        return embed.addField('Wind/Gust', [
            [`:wind_chime:`, inlineCode(`${ CommonView.speed(current.wind_speed ?? 0) } ${ WeatherService.toDirection(current.wind_deg) }`)].join(' '),
            [`:dash:`, inlineCode(`${ CommonView.speed(current.wind_gust ?? 0) }`)].join(' ')
        ].join('\n'), true);
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {MessageEmbed}
     */
    humidityPressure(embed, current) {

        return embed.addField('Humidity/Pressure', [
            [`:droplet:`, inlineCode(`${ current.humidity } %`)].join(' '),
            [`:dash:`, inlineCode(`${ current.pressure } hPa`)].join(' ')
        ].join('\n'), true);
    }

    /**
     * @param {MessageEmbed}          embed
     * @param {OneCallCurrentWeather} current
     * @param {AirQuality}            airQuality
     *
     * @return {MessageEmbed}
     */
    airQualityUVIndex(embed, current, airQuality) {

        if (isNaN(current?.uvi) && isNaN(airQuality?.main?.aqi)) {

            return this.emptyRow(embed);
        }

        const rows  = [];
        const title = [];

        if (airQuality?.main?.aqi) {

            const emoji   = [
                [':deciduous_tree:', ':evergreen_tree:', ':palm_tree:', ':tanabata_tree:'],
                [':slight_smile:'],
                [':slight_frown:'],
                [':mask:'],
                [':zombie:']
            ];
            const quality = ['Good', 'Fair', 'Moderate', 'Poor', 'Very poor'];

            title.push('Pollution');
            rows.push(`${ Util.randomValue(emoji[airQuality.main.aqi - 1]) } ${ inlineCode(quality[airQuality.main.aqi - 1]) }`);
        }

        if (isNumber(current?.uvi) && current?.uvi > 0) {

            title.push('UV Index');
            rows.push(`:sunny: ${ inlineCode(`${ current.uvi }`) }`);
        }

        return embed.addField(title.join('/'), rows.join('\n'), true);
    }
};
