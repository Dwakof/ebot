'use strict';

const Hoek = require('@hapi/hoek');

const Service    = require('./service');
const { Client } = require('undici');

class ServiceApi extends Service {

    #api;

    defaultQueryParams = {};
    defaultHeaders     = {};

    constructor(...args) {

        super(...args);

        Hoek.assert(this.constructor.ENDPOINT, `static attribute ENDPOINT is required on ${ this.id }`);
    }

    /**
     * Method to override that is called when the client is started.
     */
    init() {

        this.#api = new Client(this.constructor.ENDPOINT);
    }

    async #call(method, path, queryParams = {}, options = {}) {

        let body;
        let response;

        try {

            response = await this.#api.request({
                ...options, path, method,
                headers : { ...this.defaultHeaders, ...(options.headers ?? {}) },
                query   : { ...this.defaultQueryParams, ...queryParams }
            });
        }
        catch (err) {

            if (!err.statusCode) {

                this.client.logger.error({ msg : `${ this.id } : Error`, path, queryParams, method, err });

                throw new Error('API error', { cause : err });
            }
        }

        const { body : rawBody, statusCode, headers } = response;

        if (headers['content-type'].split(';')[0] === 'application/json') {

            body = await rawBody.json();
        }
        else {

            body = await rawBody.text();
        }

        if (statusCode >= 400) {

            this.client.logger.error({ msg : `${ this.id } : API error ${ statusCode }`, body, path, queryParams, statusCode, method });

            const error = new Error(`${ this.id } : API error ${ statusCode }`);

            error.response = { body, statusCode, headers };

            throw error;
        }

        return body;
    }

    get api() {

        return {

            get : (path, queryParams = {}, options = {}) => {

                return this.#call('GET', path, queryParams, options);
            }
        };
    }
}

module.exports = ServiceApi;
