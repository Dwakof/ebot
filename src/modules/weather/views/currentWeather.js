'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles, inlineCode } = require('discord.js');

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
     * @param {EmbedBuilder}          embed
     * @param {WeatherCondition}      condition
     * @param {Boolean}               [day=true]
     *
     * @return {EmbedBuilder}
     */
    weatherIcon(embed, condition, day = true) {

        const { WeatherService } = this.services();

        return embed.setThumbnail(WeatherService.iconURL(condition.icon.slice(0, -1), day));
    }

    /**
     * @param {EmbedBuilder}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {EmbedBuilder}
     */
    sun(embed, current) {

        const { sunrise, sunset } = current;

        return embed.addFields([
            {
                name   : 'Sunrise/Sunset',
                value  : [
                    `:city_sunrise: ${ Time(sunrise, TimestampStyles.RelativeTime) }`,
                    `:night_with_stars: ${ Time(sunset, TimestampStyles.RelativeTime) }`
                ].join('\n'),
                inline : true
            }
        ]);
    }

    /**
     * @param {EmbedBuilder}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {EmbedBuilder}
     */
    temperature(embed, current) {

        const { CommonView } = this.views();

        return embed.addFields([
            {
                name   : 'Temps/Feels like',
                value  : [
                    `:thermometer: ${ CommonView.temperature(current.temp) }`,
                    `:dash: ${ CommonView.temperature(current.feels_like) }`
                ].join('\n'),
                inline : true
            }
        ]);
    }

    /**
     * @param {EmbedBuilder}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {EmbedBuilder}
     */
    wind(embed, current) {

        const { CommonView }     = this.views();
        const { WeatherService } = this.services();

        if (current.wind_speed === 0) {

            return embed.addFields([{ name : 'Wind/Gust', value : `:wind_chime: ${ inlineCode('no wind') }`, inline : true }]);
        }

        return embed.addFields([
            {
                name   : 'Wind/Gust',
                inline : true,
                value  : [
                    [
                        `:wind_chime:`,
                        inlineCode(`${ CommonView.speed(current.wind_speed ?? 0) } ${ WeatherService.toDirection(current.wind_deg) }`)
                    ].join(' '),
                    [
                        `:dash:`,
                        inlineCode(`${ CommonView.speed(current.wind_gust ?? 0) }`)
                    ].join(' ')
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {EmbedBuilder}          embed
     * @param {OneCallCurrentWeather} current
     *
     * @return {EmbedBuilder}
     */
    humidityPressure(embed, current) {

        return embed.addFields([
            {
                name   : 'Humidity/Pressure',
                inline : true,
                value  : [
                    [`:droplet:`, inlineCode(`${ current.humidity } %`)].join(' '),
                    [`:dash:`, inlineCode(`${ current.pressure } hPa`)].join(' ')
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {EmbedBuilder}          embed
     * @param {OneCallCurrentWeather} current
     * @param {AirQuality}            airQuality
     *
     * @return {EmbedBuilder}
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

        if (Util.isNumber(current?.uvi) && current?.uvi > 0) {

            title.push('UV Index');
            rows.push(`:sunny: ${ inlineCode(`${ current.uvi }`) }`);
        }

        return embed.addFields([{ name : title.join('/'), value : rows.join('\n'), inline : true }]);
    }
};
