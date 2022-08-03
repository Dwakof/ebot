'use strict';

const { ButtonStyle } = require('discord.js');

const { ApplicationCommand, Util } = require('../../../core');

module.exports = class Weather extends ApplicationCommand {

    constructor() {

        super('weather', { description : 'Get weather information for a location' });
    }

    static get command() {

        return {
            method  : 'weather',
            options : {
                location : {
                    type         : ApplicationCommand.SubTypes.String,
                    description  : 'Location to get weather information for',
                    autocomplete : 'autocomplete',
                    required     : true
                }
            }
        };
    }

    async autocomplete(interaction, { location = '' }) {

        const { LocationService, HistoryService } = this.services();
        const { CommonView }                      = this.views();

        if (location.length < 3) {

            const history = await HistoryService.get(interaction.guildId, interaction.user.id);

            if (history.length > 0) {

                return interaction.respond(history.map(({ search }) => ({ name : search, value : search })));
            }

            return interaction.respond([{ name : 'ℹ Write something at least (min 3 characters)', value : '' }]);
        }

        try {

            const searches = await LocationService.autocomplete(location);

            return interaction.respond(Util.unique(searches.map(CommonView.location)).map((name) => ({ name, value : name })));
        }
        catch (error) {

            if (error?.response?.statusCode === 404) {

                return interaction.respond([{ name : '⚠ No result found', value : location }]);
            }

            throw error;
        }
    }

    async weather(interaction, { location : query }) {

        await interaction.deferReply();

        const { LocationService, WeatherService, HistoryService }                       = this.services();
        const { CurrentWeatherView, WeatherForecastView, WeatherAlertView, CommonView } = this.views();

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

            return interaction.editReply({ content : `⚠ Unable to find location "${ query }"`, ephemeral : true });
        }

        const historyPromise = HistoryService.save(interaction.guildId, interaction.user.id, location);

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
                        selected   : ButtonStyle.Danger,
                        unselected : ButtonStyle.Danger
                    }
                });
            }

            await new Util.DashboardPaginatedEmbeds(interaction, embeds).send();
        }
        catch (error) {

            this.client.logger.error({ err : error });

            await interaction.editReply({
                content   : `⚠ Unable to get weather information for location "${ CommonView.location(location) }"`,
                ephemeral : true
            });
        }
        finally {

            await historyPromise;
        }
    }
};
