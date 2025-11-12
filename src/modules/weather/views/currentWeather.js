'use strict';

const { View, Util } = require('../../../core');

const { time : Time, TimestampStyles, inlineCode } = require('discord.js');

class CurrentWeatherView extends View {

    /**
     * @param {import('../services/weather.cts').WeatherData}       weather
     * @param {import('../services/airQuality.cts').AirQualityData} airQuality
     * @param {import('../services/location.cts').Location}         location
     */
    render(weather, airQuality, location) {

        const { CommonView } = this.views();

        const embed = this.embed()
            .setTitle(CommonView.location(location))
            .setTimestamp(weather.current.time)
            .setThumbnail(CommonView.wmoCodeToIconUrl(weather.current.code, weather.current.daytime));

        CommonView.wmoCodeField(embed, weather.current.code, weather.current.daytime);

        this.sun(embed, weather);
        this.temperature(embed, weather);

        this.wind(embed, weather);
        this.humidityPressure(embed, weather);
        this.airQualityUVIndex(embed, airQuality);

        return embed;
    }

    /**
     * @param {import('discord.js').EmbedBuilder}             embed
     * @param {import('../services/weather.cts').WeatherData} weather
     *
     * @return {import('discord.js').EmbedBuilder}
     */
    sun(embed, weather) {

        return embed.addFields([
            {
                inline : true,
                name   : 'Sunrise/Sunset',
                value  : [
                    `🏙 ${ Time(weather.current.sunrise, TimestampStyles.RelativeTime) }`,
                    `🌆 ${ Time(weather.current.sunset, TimestampStyles.RelativeTime) }`
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}             embed
     * @param {import('../services/weather.cts').WeatherData} weather
     *
     * @return {EmbedBuilder}
     */
    temperature(embed, weather) {

        const { CommonView } = this.views();

        return embed.addFields([
            {
                name   : 'Temps/Feels like',
                inline : true,
                value  : [
                    `🌡 ${ CommonView.temperature(weather.current.temperature) }`,
                    `💨 ${ CommonView.temperature(weather.current.apparentTemperature) }`
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}             embed
     * @param {import('../services/weather.cts').WeatherData} weather
     *
     * @return {import('discord.js').EmbedBuilder}
     */
    wind(embed, weather) {

        const { CommonView } = this.views();

        if (weather.current.wind.speed === 0) {

            return embed.addFields([{ name : 'Wind/Gust', value : `🎐 ${ inlineCode('no wind') }`, inline : true }]);
        }

        return embed.addFields([
            {
                name   : 'Wind/Gust',
                inline : true,
                value  : [
                    [
                        `🎐`,
                        inlineCode(`${ CommonView.speed(weather.current.wind.speed ?? 0) } ${ CommonView.toCardinalDirection(weather.current.wind.direction) }`)
                    ].join(' '),
                    [
                        `💨`,
                        inlineCode(`${ CommonView.speed(weather.current.wind.gusts ?? 0) }`)
                    ].join(' ')
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}             embed
     * @param {import('../services/weather.cts').WeatherData} weather
     *
     * @return {import('discord.js').EmbedBuilder}
     */
    humidityPressure(embed, weather) {

        return embed.addFields([
            {
                name   : 'Humidity/Pressure',
                inline : true,
                value  : [
                    [`💧`, inlineCode(`${ weather.current.humidity } %`)].join(' '),
                    [`💨`, inlineCode(`${ weather.current.pressure } hPa`)].join(' ')
                ].join('\n')
            }
        ]);
    }

    /**
     * @param {import('discord.js').EmbedBuilder}                   embed
     * @param {import('../services/airQuality.cts').AirQualityData} airQuality
     *
     * @return {import('discord.js').EmbedBuilder}
     */
    airQualityUVIndex(embed, airQuality) {

        const { CommonView } = this.views();

        const rows  = [];
        const title = [];

        if (Util.isNumber(airQuality.aqi)) {

            title.push('Pollution');
            rows.push(CommonView.aqi(airQuality.aqi));
        }

        if (Util.isNumber(airQuality.uvi) && airQuality.uvi > 0) {

            title.push('UV Index');
            rows.push(CommonView.uvi(airQuality.uvi));
        }

        if (rows.length === 0) {

            return embed;
        }

        return embed.addFields([{ name : title.join('/'), value : rows.join('\n'), inline : true }]);
    }
}

module.exports = CurrentWeatherView;
