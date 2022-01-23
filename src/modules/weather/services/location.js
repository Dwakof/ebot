'use strict';

const { Client } = require('undici');

const { Service } = require('../../../core');

module.exports = class LocationService extends Service {

    static ENDPOINT = 'https://eu1.locationiq.com';

    #api;
    #defaultQuery;

    init() {

        this.#api = new Client(LocationService.ENDPOINT);

        this.#defaultQuery = {
            key               : this.client.settings.plugins.weather.LocationIQApiKey,
            format            : 'json',
            addressdetails    : 1,
            normalizecity     : 1,
            'accept-language' : 'en',
            limit             : 1
        };
    }

    /**
     * @param {String} method
     * @param {String} path
     * @param {Object} [queryParams={}]
     *
     * @return {Promise<*>}
     */
    async #call(method, path, queryParams = {}) {

        const _path = `${ path }?${ new URLSearchParams({ ...this.#defaultQuery, ...queryParams }) }`;

        const response = await this.#api.request({ path : _path, method });

        const { body, statusCode } = response;

        if (statusCode >= 400) {

            this.client.logger.error({
                msg      : `LocationIQ API error ${ statusCode }`,
                response : await body.json(),
                path     : _path,
                queryParams, method, statusCode
            });

            const error = new Error(`LocationIQ API error ${ statusCode }`);

            error.response = response;

            throw error;
        }

        return body.json();
    }

    /**
     * @param {String} query
     * @param {Object} [queryOptions={}]
     *
     * @return {Promise<Array<Location>>}
     */
    search(query, queryOptions = {}) {

        return this.#call('GET', '/v1/search.php', { q : query, ...queryOptions });
    }

    /**
     * @typedef {Object} Location
     *
     * @property {Number} lat
     * @property {Number} lon
     * @property {String} description
     * @property {Object} address
     * @property {String} address.city
     * @property {String} address.county
     * @property {String} address.state
     * @property {String} address.country
     */
};
