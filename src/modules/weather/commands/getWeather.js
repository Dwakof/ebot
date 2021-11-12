'use strict';

const Got = require('got');

const { Command } = require('../../../core');

module.exports = class WeatherCommand extends Command {

    #weatherApi;
    #mapApi;

    constructor() {

        super('weather', {
            aliases     : ['weather'],
            category    : 'weather',
            args        : [
                {
                    id    : 'location',
                    type  : 'string',
                    match : 'rest'
                }
            ],
            description : {
                content  : 'Get the weather for a named location',
                usage    : 'weather <location>',
                examples : ['weather Paris', 'weather Sarajevo', 'weather London Canada']
            }
        });
    }

    async exec(message, args) {

        if (!this.#weatherApi) {

            this.#weatherApi = Got.extend({
                prefixUrl    : 'https://api.openweathermap.org/',
                searchParams : { appid : this.client.settings.plugins.weather.openWeatherApiKey },
                responseType : 'json'
            });
        }

        if (!this.#mapApi) {

            this.#mapApi = Got.extend({
                prefixUrl    : 'https://eu1.locationiq.com',
                responseType : 'json',
                searchParams : {
                    key            : this.client.settings.plugins.weather.LocationIQApiKey,
                    addressdetails : 1,
                    normalizecity  : 1,
                    limit          : 1,
                    format         : 'json'
                }
            });
        }

        try {

            const { body : mapBody, statusCode } =
                      await this.#mapApi.get('v1/search.php', { searchParams : { q : args.location } });

            if (statusCode > 200 || !Array.isArray(mapBody) || mapBody.length <= 0) {

                await message.util.send(`Woopsy, something went wrong when looking for "${ args.location }"`);

                return;
            }

            const embed = this.client.util.embed()
                .setTimestamp()
                .setTitle(`Weather for "${ args.location }"`);

            try {

                const [, { body : weatherBody }] = await Promise.all([
                    message.util.send({ embeds : [embed] }),
                    this.#weatherApi.get('data/2.5/weather', {
                        searchParams : {
                            lat : mapBody[0].lat,
                            lon : mapBody[0].lon
                        }
                    })
                ]);

                embed.setDescription(capitalize(`${ weatherBody.weather[0].description } in ${ mapBody[0].address.city || mapBody[0].address.county || mapBody[0].address.state || mapBody[0].address.country }, ${ mapBody[0].address.country }`));

                if (toCelsius(weatherBody.main.temp) !== toCelsius(weatherBody.main.feels_like)) {

                    embed.addField('Temperature', `${ toCelsius(weatherBody.main.temp) }°C (${ toFahrenheit(weatherBody.main.temp) }°F) but feels like ${ toCelsius(weatherBody.main.feels_like) }°C (${ toFahrenheit(weatherBody.main.feels_like) }°F)`, false);
                }
                else {

                    embed.addField('Temperature', `${ toCelsius(weatherBody.main.temp) }°C (${ toFahrenheit(weatherBody.main.temp) }°F)`, false);
                }

                const test = 'toto';

                embed.addField('Humidity', `${ weatherBody.main.humidity } %`, false)
                    .addField('Wind', `${ Math.round(weatherBody.wind.speed * 3.6) } Km/h (${ Math.round(weatherBody.wind.speed * 2.23694) } Mph) ${toDirection(weatherBody.wind.deg)}`, false)
                    .setThumbnail(`https://openweathermap.org/img/wn/${ weatherBody.weather[0].icon }@2x.png`);

                return message.util.send({ embeds : [embed] });
            }
            catch (error) {

                await message.util.send(`Woopsy, something went wrong when looking for "${ args.location }"`);

                this.client.handleError(this, error, message);
            }
        }
        catch (error) {

            await message.util.send(`Woopsy, something went wrong when looking for "${ args.location }"`);

            this.client.handleError(this, error, message);
        }
    }
};

const toDirection = (deg) => {

    const d = deg % 360;

    if (d >= 11.25 && d < 33.75) {
        return 'NNE';
    }
    else if (d >= 33.75 && d < 56.25) {
        return 'NE';
    }
    else if (d >= 56.25 && d < 78.75) {
        return 'ENE';
    }
    else if (d >= 78.75 && d < 101.25) {
        return 'E';
    }
    else if (d >= 101.25 && d < 123.75) {
        return 'ESE';
    }
    else if (d >= 123.75 && d < 146.25) {
        return 'SE';
    }
    else if (d >= 146.25 && d < 168.75) {
        return 'SSE';
    }
    else if (d >= 168.75 && d < 191.25) {
        return 'S';
    }
    else if (d >= 191.25 && d < 213.75) {
        return 'SSW';
    }
    else if (d >= 213.75 && d < 236.25) {
        return 'SW';
    }
    else if (d >= 236.25 && d < 258.75) {
        return 'WSW';
    }
    else if (d >= 258.75 && d < 281.25) {
        return 'W';
    }
    else if (d >= 281.25 && d < 303.75) {
        return 'WNW';
    }
    else if (d >= 303.75 && d < 326.25) {
        return 'NW';
    }
    else if (d >= 326.25 && d < 348.75) {
        return 'NNW';
    }

    return 'N';
};

const toCelsius = (temp) => {

    return Math.round(temp - 273.15);
};

const toFahrenheit = (temp) => {

    return Math.round(toCelsius(temp) * 9 / 5 + 32);
};

const capitalize = (s) => {

    if (typeof s !== 'string') {
        return '';
    }

    return s.charAt(0).toUpperCase() + s.slice(1);
};
