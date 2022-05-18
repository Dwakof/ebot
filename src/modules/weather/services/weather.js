'use strict';

const { ServiceApi } = require('../../../core');

module.exports = class WeatherService extends ServiceApi {

    static ENDPOINT = 'https://api.openweathermap.org/';

    init() {

        super.init();

        this.defaultQueryParams = { appid : this.client.settings.plugins.weather.openWeatherApiKey, units : 'standard', lang : 'en' };
    }

    /**
     * @param {Number} lat
     * @param {Number} lon
     * @param {Object} [queryOptions={}]
     *
     * @return {Promise<WeatherResponse>}
     */
    getCurrentWeather(lat, lon, queryOptions = {}) {

        return this.api.get('/data/2.5/weather', { lat, lon, ...queryOptions });
    }

    /**
     * @param {Number} lat
     * @param {Number} lon
     * @param {Number} [count=5]
     * @param {Object} [queryOptions={}]
     *
     * @return {Promise<WeatherForecastResponse>}
     */
    getDailyForecast(lat, lon, count = 5, queryOptions = {}) {

        return this.api.get('/data/2.5/daily', { lat, lon, cnt : count, ...queryOptions });
    }

    /**
     * @param {Number}  lat
     * @param {Number}  lon
     *
     * @param {Number}  [options={}]
     * @param {Boolean} [options.alert=true]
     * @param {Boolean} [options.current=true]
     * @param {Boolean} [options.daily=true]
     * @param {Boolean} [options.hourly=false]
     * @param {Boolean} [options.minutely=false]
     *
     * @param {Object}  [queryOptions={}]
     *
     * @return {Promise<OneCallWeatherResponse>}
     */
    oneCall(lat, lon, options = {}, queryOptions = {}) {

        const { current = true, minutely = false, hourly = false, daily = true, alerts = true } = options;

        const exclude = [
            !current ? 'current' : '',
            !minutely ? 'minutely' : '',
            !hourly ? 'hourly' : '',
            !daily ? 'daily' : '',
            !alerts ? 'alerts' : ''
        ].filter(Boolean).join(',');

        return this.api.get('/data/2.5/onecall', { lat, lon, exclude, ...queryOptions });
    }

    /**
     * @param {Number}  lat
     * @param {Number}  lon
     *
     * @param {Object}  [queryOptions={}]
     *
     * @return {Promise<AirQualityResponse>}
     */
    airQuality(lat, lon, queryOptions = {}) {

        return this.api.get('/data/2.5/air_pollution', { lat, lon, ...queryOptions });
    }

    CardinalDirection        = ['N', 'E', 'S', 'W'];
    IntercardinalDirection   = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    SixteenCardinalDirection = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];

    /**
     * Take a wind direction in degrees and return a cardinal direction from a list of cardinal directions.
     *  - Divide 360 by `x` to get the `cardinalSize`, `x` = length of `cardinalDirections` array
     *  - Rotate the wind direction by half a `cardinalSize` clockwise to make the northmost cardinal direction starting at the 0th degree
     *  - Modulo the rotated wind direction by 360 to remove offset (i.e. if rotated wind direction is 370, modulo by 360 will be 10)
     *  - Divide the result by `cardinalSize` and round the value to get the index of the cardinal direction
     *
     * @param {Number}        degree                - Wind direction in degrees
     * @param {Array<String>} [cardinalDirections]  - Cardinal directions
     *
     * @return {string}
     */
    toDirection(degree, cardinalDirections = this.IntercardinalDirection) {

        const cardinalSize = 360 / cardinalDirections.length;

        return cardinalDirections[Math.floor((degree + (cardinalSize / 2)) % 360 / cardinalSize)];
    }

    kelvinToCelsius(temp) {

        return Math.round(temp - 273.15);
    }

    celsiusToFahrenheit(temp) {

        return Math.round(temp * 9 / 5 + 32);
    }

    iconURL(id, day = true, size = '4x') {

        return `https://openweathermap.org/img/wn/${ id }${ day ? 'd' : 'n' }@${ size }.png`;
    }

    /**
     * @typedef {Object} WeatherCondition
     *
     * @property {Number} id           - Weather condition id
     * @property {String} main         - Group of weather parameters (Rain, Snow, Extreme etc.)
     * @property {String} description  - Weather condition within the group
     * @property {String} icon         - Weather icon id
     */

    /**
     * @typedef {Object} WeatherResponse
     *
     * @property {Object} coord           - City geolocation
     * @property {Number} coord.lat       - City geolocation latitude
     * @property {Number} coord.lon       - City geolocation longitude
     *
     * @property {Array<WeatherCondition>} weather
     *
     * @property {Number} base            - Internal parameter
     *
     * @property {Object} main            - Temperature, pressure, humidity
     * @property {Number} main.pressure   - Atmospheric pressure (on the sea level, if there is no sea_level or grnd_level data), hPa
     * @property {Number} main.humidity   - Humidity, %
     * @property {Number} main.temp       - Temperature. Unit Kelvin
     * @property {Number} main.temp_min   - Minimum temperature at the moment. This is deviation from current temp that is possible for large cities and megalopolises geographically expanded (use these parameters optionally). Unit Kelvin
     * @property {Number} main.temp_max   - Maximum temperature at the moment. This is deviation from current temp that is possible for large cities and megalopolises geographically expanded (use these parameters optionally). Unit Kelvin
     * @property {Number} main.feels_like - Temperature. This temperature parameter accounts for the human perception of weather
     * @property {Number} main.grnd_level - Atmospheric pressure on the sea level, hPa
     * @property {Number} main.sea_level  - Atmospheric pressure on the sea level, hPa
     *
     * @property {Number} visibility      - Visibility, meter
     *
     * @property {Object} wind            - Wind
     * @property {Number} wind.speed      - Wind speed. Unit meter/sec
     * @property {Number} wind.deg        - Wind direction, degrees (meteorological)
     *
     * @property {Object} clouds          - Cloudiness
     * @property {Number} clouds.all      - Cloudiness, %
     *
     * @property {Object} rain            - Rain
     * @property {Number} rain.3h         - Rain volume for the last 3 hours. Unit mm
     * @property {Number} rain.1h         - Rain volume for the last 1 hour. Unit mm
     *
     * @property {Object} snow            - Snow
     * @property {Number} snow.3h         - Snow volume for the last 3 hours. Unit mm
     * @property {Number} snow.1h         - Snow volume for the last 1 hour. Unit mm
     *
     * @property {Number} dt              - Time of data calculation, unix, UTC
     * @property {Number} sys             - Internal parameter
     * @property {Number} sys.type        - Internal parameter
     * @property {Number} sys.id          - Internal parameter
     * @property {Number} sys.country     - Country code
     * @property {Number} sys.sunrise     - Sunrise time, unix, UTC
     * @property {Number} sys.sunset      - Sunset time, unix, UTC
     *
     * @property {Number} id              - City ID
     * @property {String} name            - City name
     * @property {String} timezone        - Timezone. Shift in seconds from UTC
     */

    /**
     * @typedef {Object} WeatherForecastDay
     *
     * @property {String} dt                          - Time of data calculation, unix, UTC
     *
     * @property {Object} temp                        - Temperature
     * @property {Number} temp.day                    - Day temperature. Unit Kelvin
     * @property {Number} temp.min                    - Min daily temperature. Unit Kelvin
     * @property {Number} temp.max                    - Max daily temperature. Unit Kelvin
     * @property {Number} temp.night                  - Night temperature. Unit Kelvin
     * @property {Number} temp.eve                    - Evening temperature. Unit Kelvin
     * @property {Number} temp.morn                   - Morning temperature. Unit Kelvin
     *
     * @property {Object} feels_like                  - Temperature. This temperature parameter accounts for the human perception of weather
     * @property {Number} feels_like.day              - Day temperature. Unit Kelvin
     * @property {Number} feels_like.night            - Night temperature. Unit Kelvin
     * @property {Number} feels_like.eve              - Evening temperature. Unit Kelvin
     * @property {Number} feels_like.morn             - Morning temperature. Unit Kelvin
     *
     * @property {Number} pressure                    - Atmospheric pressure
     * @property {Number} humidity                    - Humidity
     *
     * @property {Array<WeatherCondition>} weather    - Weather conditions
     *
     * @property {Number} speed                        - Wind speed. Unit meter/sec
     * @property {Number} deg                          - Wind direction, degrees (meteorological)
     * @property {Number} gust                         - Wind gust. Unit meter/sec
     *
     * @property {Number} clouds                       - Cloudiness, percent
     *
     * @property {Number} rain                         - Rain volume for the day. Unit mm
     * @property {Number} snow                         - Snow volume for the day. Unit mm
     * @property {Number} pop                          - Chance of precipitation. Unit %
     *
     * @property {Number} uvi                          - UV index
     * @property {Number} sunrise                      - Sunrise time, unix, UTC
     * @property {Number} sunset                       - Sunset time, unix, UTC
     *
     * @property {Number} moonrise                     - Moonrise time, unix, UTC
     * @property {Number} moonset                      - Moonset time, unix, UTC
     * @property {Number} moon_phase                   - Moon phase. 0 and 1 are 'new moon', 0.25 is 'first quarter moon', 0.5 is 'full moon' and 0.75 is 'last quarter moon'. The periods in between are called 'waxing crescent', 'waxing gibous', 'waning gibous', and 'waning crescent', respectively.
     */

    /**
     * @typedef {Object} WeatherForecastResponse
     *
     * @property {Object} city
     * @property {Number} city.id          - City ID
     * @property {String} city.name        - City name
     * @property {Object} city.coord       - City geolocation
     * @property {Number} city.coord.lat   - City geolocation latitude
     * @property {Number} city.coord.lon   - City geolocation longitude
     *
     * @property {String} cod              - Internal parameter
     * @property {Number} message          - Internal parameter
     * @property {Number} cnt              - Number of days in the forecast
     * @property {String} country          - Country code
     * @property {String} population       - City population
     * @property {String} timezone         - Timezone. Shift in seconds from UTC
     *
     * @property {Array<WeatherForecastDay>} list
     */

    /**
     * @typedef {Object} WeatherAlert
     *
     * @property {String}        sender_name     - Name of the sender
     * @property {String}        event           - Type of the event
     * @property {String}        description     - Description of the event
     * @property {Number}        start           - Start time of the event
     * @property {Number}        end             - End time of the event
     * @property {Array<String>} tags            - Tags of the event
     */

    /**
     * @typedef {Object} OneCallCurrentWeather
     *
     * @property {Array<WeatherCondition>} weather
     *
     * @property {Number} pressure        - Atmospheric pressure (on the sea level, if there is no sea_level or grnd_level data), hPa
     * @property {Number} humidity        - Humidity, %
     * @property {Number} dew_point       - Dew point, unit Kelvin
     * @property {Number} temp            - Temperature. Unit Kelvin
     * @property {Number} feels_like      - Temperature. This temperature parameter accounts for the human perception of weather
     *
     * @property {Number} visibility      - Visibility, meter
     *
     * @property {Number} wind_speed      - Wind speed. Unit meter/sec
     * @property {Number} wind_deg        - Wind direction, degrees (meteorological)
     * @property {Number} wind_gust       - Wind gust. Unit meter/sec
     *
     * @property {Object} clouds          - Cloudiness, percent
     *
     * @property {Object} rain            - Rain
     * @property {Number} rain.3h         - Rain volume for the last 3 hours. Unit mm
     * @property {Number} rain.1h         - Rain volume for the last 1 hour. Unit mm
     *
     * @property {Object} snow            - Snow
     * @property {Number} snow.3h         - Snow volume for the last 3 hours. Unit mm
     * @property {Number} snow.1h         - Snow volume for the last 1 hour. Unit mm
     *
     * @property {Number} uvi             - UV index
     * @property {Number} sunrise         - Sunrise time, unix, UTC
     * @property {Number} sunset          - Sunset time, unix, UTC
     *
     * @property {Number} dt              - Time of data calculation, unix, UTC
     */

    /**
     * @typedef {Object} OneCallWeatherResponse
     *
     * @property {OneCallCurrentWeather}     [current]
     * @property {Array<WeatherForecastDay>} [daily]
     * @property {Array<WeatherAlert>}       [alerts]
     *
     * @property {String}                   [timezone]
     * @property {Number}                   [timezone_offset]
     * @property {Number}                   lat
     * @property {Number}                   lon
     */

    /**
     * @typedef {Object} AirQuality
     *
     * @property {Number} dt                 - Time of data calculation, unix, UTC
     *
     * @property {Object} main
     * @property {Number} main.aqi           - Air Quality Index. Possible values: 1, 2, 3, 4, 5. Where 1 = Good, 2 = Fair, 3 = Moderate, 4 = Poor, 5 = Very Poor.
     *
     * @property {Object} components
     * @property {Number} components.co      - Сoncentration of CO (Carbon monoxide), μg/m3
     * @property {Number} components.no      - Сoncentration of NO (Nitrogen monoxide), μg/m3
     * @property {Number} components.no2     - Сoncentration of NO2 (Nitrogen dioxide), μg/m3
     * @property {Number} components.o3      - Сoncentration of O3 (Ozone), μg/m3
     * @property {Number} components.so2     - Сoncentration of SO2 (Sulfur dioxide), μg/m3
     * @property {Number} components.pm10    - Сoncentration of PM10 (Coarse particulate matter), μg/m3
     * @property {Number} components.pm2_5   - Сoncentration of PM2.5 (Fine particulate matter), μg/m3
     * @property {Number} components.nh3     - Сoncentration of NH3 (Ammonia), μg/m3
     */

    /**
     * @typedef {Object} AirQualityResponse
     *
     * @property {Array<AirQuality>} list
     */
};
