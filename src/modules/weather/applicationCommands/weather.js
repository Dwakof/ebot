'use strict';

const { Constants } = require('discord.js');

const { ApplicationCommand, Util } = require('../../../core');

module.exports = class Karma extends ApplicationCommand {

    constructor() {

        super('weather', { description : 'Get weather information for a location' });
    }

    static get command() {

        return {
            method  : 'weather',
            options : {
                location : {
                    type        : ApplicationCommand.SubTypes.String,
                    description : 'Location to get weather information for',
                    required    : true
                }
            }
        };
    }

    async weather(interaction, { location : query }) {

        await interaction.deferReply();

        const { LocationService, WeatherService }                           = this.services();
        const { CurrentWeatherView, WeatherForecastView, WeatherAlertView } = this.views();

        let location;

        try {

            const searches = await LocationService.search(query, { limit : 1 });

            if (searches.length === 0) {

                throw new Error('No results found');
            }

            location = searches[0];
        }
        catch (error) {

            this.client.logger.error({ err : error });

            return interaction.editReply({ content : `Unable to find location "${ query }"`, ephemeral : true });
        }

        try {

            const [{ current, daily, alerts }, { list : [airQuality] }] = await Promise.all([
                WeatherService.oneCall(location.lat, location.lon),
                WeatherService.airQuality(location.lat, location.lon)
            ]);

            const embeds = [
                { id : 'current', label : 'Current', embed : CurrentWeatherView.render(current, airQuality, location) },
                { id : 'forecast', label : 'Forecast', embed : WeatherForecastView.daily(daily, location) }
            ];

            if (alerts?.length > 0) {

                embeds.push({
                    id    : 'alert',
                    label : 'Alerts',
                    embed : WeatherAlertView.render(alerts, location),
                    style : {
                        selected   : Constants.MessageButtonStyles.DANGER,
                        unselected : Constants.MessageButtonStyles.DANGER
                    }
                });
            }

            return new Util.DashboardPaginatedEmbeds(interaction, embeds).send();
        }
        catch (error) {

            this.client.logger.error({ err : error });

            return interaction.editReply({ content : `Unable to get weather information for location "${ location }"`, ephemeral : true });
        }
    }
};
