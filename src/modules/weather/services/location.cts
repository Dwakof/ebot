'use strict';

const { ServiceApi } = require('../../../core');

export interface Location {
    lat : number;
    lon : number;
    description : string;
    address : {
        hamlet : string;
        village : string;
        municipality : string;
        county : string;
        state : string;
        region : string;
        postcode : string;
        country : string;
        city : string;
    }
}

class LocationService extends ServiceApi {

    static ENDPOINT = 'https://eu1.locationiq.com';

    init(settings : { LocationIQApiKey : string }) {

        super.init();

        this.defaultQueryParams = {
            key               : settings.LocationIQApiKey,
            format            : 'json',
            addressdetails    : 1,
            normalizecity     : 1,
            dedupe            : 1,
            'accept-language' : 'en'
        };
    }

    search(query: string, queryOptions : object = {}): Promise<Array<Location>> {

        return this.api.get('/v1/search.php', { q : query, ...queryOptions });
    }

    autocomplete(query: string, queryOptions : object = {}) {

        return this.api.get('/v1/autocomplete.php', { q : query, ...queryOptions });
    }

    static get caching() {

        return {
            autocomplete : {
                generateKey : (query: string, queryOptions : object = {}) => `${ query }-${ JSON.stringify(queryOptions || {}) }`
            },
            search       : {
                generateKey : (query: string, queryOptions : object = {}) => `${ query }-${ JSON.stringify(queryOptions || {}) }`
            }
        };
    }
}

module.exports = LocationService;
