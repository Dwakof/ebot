'use strict';

const { ServiceApi } = require('../../../core');

module.exports = class LocationService extends ServiceApi {

    static ENDPOINT = 'https://eu1.locationiq.com';

    init(settings) {

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

    /**
     * @param {String} query
     * @param {Object} [queryOptions={}]
     *
     * @return {Promise<Array<Location>>}
     */
    search(query, queryOptions = {}) {

        return this.api.get('/v1/search.php', { q : query, ...queryOptions });
    }

    autocomplete(query, queryOptions = {}) {

        return this.api.get('/v1/autocomplete.php', { q : query, ...queryOptions });
    }

    static get caching() {

        return {
            autocomplete : {
                generateKey : (query, queryOptions) => `${ query }-${ JSON.stringify(queryOptions || {}) }`
            },
            search       : {
                generateKey : (query, queryOptions) => `${ query }-${ JSON.stringify(queryOptions || {}) }`
            }
        };
    }

    /**
     * @typedef {Object} Location
     *
     * @property {Number} lat
     * @property {Number} lon
     * @property {String} description
     * @property {Object} address
     * @property {String} address.hamlet
     * @property {String} address.village
     * @property {String} address.municipality
     * @property {String} address.county
     * @property {String} address.state
     * @property {String} address.region
     * @property {String} address.postcode
     * @property {String} address.country
     * @property {String} address.city
     */
};
