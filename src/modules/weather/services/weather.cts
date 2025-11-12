'use strict';

const { ServiceApi } = require('../../../core');

export interface DailyWeatherData {
    day : Date;
    code : number;
    sunrise : Date;
    sunset : Date;
    humidity : number;
    pressure : number;
    temperature : {
        min : number,
        max : number
    };
    apparentTemperature : {
        min : number,
        max : number
    };
    wind : {
        direction : number;
        speed : number;
        gusts : number;
    };
}

export interface HourlyWeatherData {
    time : Date;
    daytime : boolean;
    hour : number;
    code : number;
    temperature : number;
    apparentTemperature : number;
    precipitationProbability : number;
}

export interface CurrentWeatherData {
    time : Date;
    code : number;
    daytime : boolean;
    temperature : number;
    apparentTemperature : number;
    humidity : number;
    pressure : number;
    sunrise : Date;
    sunset : Date;
    wind : {
        direction : number;
        speed : number;
        gusts : number;
    }
}

export interface WeatherData {
    info : {
        timezone : string;
        utc_offset : number;
    };
    current : CurrentWeatherData;
    daily : DailyWeatherData[];
    // hourly : HourlyWeatherData[];
}

class WeatherService extends ServiceApi {

    static ENDPOINT = 'https://api.open-meteo.com/';

    async getWeatherData(latitude : number, longitude : number) {

        const data = await this.api.get('/v1/forecast', {
            latitude,
            longitude,
            wind_speed_unit  : 'ms',
            temperature_unit : 'celsius',
            format           : 'json',
            timezone         : 'GMT',
            forecast_hours   : 10,
            forecast_days    : 5,
            daily            : [
                'weather_code',
                // 'uv_index_max',
                'sunrise', 'sunset',
                // 'daylight_duration', 'sunshine_duration',
                // 'precipitation_probability_max',
                'temperature_2m_max', 'temperature_2m_min',
                'apparent_temperature_max', 'apparent_temperature_min',
                'wind_speed_10m_max', 'wind_gusts_10m_max', 'wind_direction_10m_dominant',
                'relative_humidity_2m_mean', 'surface_pressure_mean'
            ],
            // hourly           : [
            //     'weather_code', 'is_day',
            //     'temperature_2m', 'apparent_temperature',
            //     'precipitation', 'precipitation_probability',
            //     'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m'
            // ],
            current          : [
                'weather_code',
                'temperature_2m', 'apparent_temperature',
                // 'precipitation', 'rain', 'showers', 'snowfall',
                'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m',
                'relative_humidity_2m', 'surface_pressure',
                // 'cloud_cover',
                'is_day'
            ]
        });

        const weather : WeatherData = {
            daily   : [],
            // hourly  : [],
            info    : {
                timezone   : data.timezone as string,
                utc_offset : data.utc_offset_seconds as number
            },
            current : {
                time                : new Date(data.current.time as string + 'Z'),
                code                : data.current.weather_code as number,
                temperature         : data.current.temperature_2m as number,
                apparentTemperature : data.current.apparent_temperature as number,
                humidity            : data.current.relative_humidity_2m as number,
                pressure            : data.current.surface_pressure as number,
                sunrise             : new Date(data.daily.sunrise[0] as string + 'Z'),
                sunset              : new Date(data.daily.sunset[0] as string + 'Z'),
                daytime             : !!data.current.is_day,
                wind                : {
                    direction : data.current.wind_direction_10m as number,
                    speed     : data.current.wind_speed_10m as number,
                    gusts     : data.current.wind_gusts_10m as number
                }
            }
        };

        for (const [idx, day] of Object.entries(data.daily.time as string[])) {

            if (day <= data.current.time) {

                continue; // skip past days
            }

            weather.daily.push({
                day                 : new Date(day + 'Z'),
                code                : data.daily.weather_code[idx],
                sunrise             : new Date(data.daily.sunrise[idx] as string + 'Z'),
                sunset              : new Date(data.daily.sunset[idx] as string + 'Z'),
                humidity            : data.daily.relative_humidity_2m_mean[idx] as number,
                pressure            : data.daily.surface_pressure_mean[idx] as number,
                temperature         : {
                    min : data.daily.temperature_2m_min[idx] as number,
                    max : data.daily.temperature_2m_max[idx] as number
                },
                apparentTemperature : {
                    min : data.daily.apparent_temperature_min[idx] as number,
                    max : data.daily.apparent_temperature_max[idx] as number
                },
                wind                : {
                    direction : data.daily.wind_direction_10m_dominant[idx] as number,
                    speed     : data.daily.wind_speed_10m_max[idx] as number,
                    gusts     : data.daily.wind_gusts_10m_max[idx] as number
                }
            });
        }

        // for (const [idx, time] of Object.entries(data.hourly.time as string[])) {
        //
        //     if (time <= data.current.time) {
        //
        //         continue; // skip past hours
        //     }
        //
        //     weather.hourly.push({
        //         time                     : new Date(time + 'Z'),
        //         hour                     : new Date(time + 'Z').getHours(),
        //         code                     : data.hourly.weather_code[idx],
        //         temperature              : data.hourly.temperature_2m[idx] as number,
        //         apparentTemperature      : data.hourly.apparent_temperature[idx] as number,
        //         precipitationProbability : data.hourly.precipitation_probability[idx] as number,
        //         daytime                  : !!data.current.is_day
        //     });
        // }

        return weather;
    }
}

module.exports = WeatherService;
