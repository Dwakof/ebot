'use strict';

const { ServiceApi } = require('../../../core');

export interface AirQualityData {
    pollens : string[];
    uvi : number;
    aqi : number;
}

class AirQualityService extends ServiceApi {

    static ENDPOINT = 'https://air-quality-api.open-meteo.com/';

    async getAirQualityData(latitude : number, longitude : number) : Promise<AirQualityData> {

        const data = await this.api.get('/v1/air-quality', {
            latitude, longitude,
            format   : 'json',
            timezone : 'GMT',
            current  : [
                'alder_pollen', 'birch_pollen', 'grass_pollen', 'mugwort_pollen', 'olive_pollen', 'ragweed_pollen',
                'european_aqi',
                'uv_index'
            ]
        });

        return {
            aqi     : data.current.european_aqi as number,
            uvi     : data.current.uv_index as number,
            pollens : [
                data.current.alder_pollen > 0 ? 'Alder' : null,
                data.current.birch_pollen > 0 ? 'Birch' : null,
                data.current.grass_pollen > 0 ? 'Grass' : null,
                data.current.mugwort_pollen > 0 ? 'Mugwort' : null,
                data.current.olive_pollen > 0 ? 'Olive' : null,
                data.current.ragweed_pollen > 0 ? 'Ragweed' : null
            ].filter(Boolean)
        };
    }
}

module.exports = AirQualityService;
