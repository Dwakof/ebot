'use strict';

const Hoek                 = require('@hapi/hoek');
const { Client }           = require('undici');
const { encodeQueryValue } = require('ufo');

const Service = require('./service');

class ServiceApi extends Service {

    #api;

    defaultQueryParams = {};
    defaultHeaders     = {};

    constructor(...args) {

        super(...args);

        Hoek.assert(this.constructor.ENDPOINT, `static attribute ENDPOINT is required on ${ this.id }`);
    }

    get api() {

        return {

            get : (path, queryParams = {}, options = {}) => {

                return this.#call('GET', path, queryParams, options);
            },

            post : (path, body, queryParams = {}, options = {}) => {

                return this.#call('POST', path, queryParams, { body, ...options });
            }
        };
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

        const query = {};

        for (const [key, value] of Object.entries({ ...this.defaultQueryParams, ...queryParams })) {

            if (value === undefined) {

                continue;
            }

            if (value instanceof Date) {

                query[key] = encodeQueryValue(value);
            }

            if (Array.isArray(value)) {

                const values = [];

                for (const v of value) {

                    if (v !== undefined) {

                        values.push(encodeQueryValue(v));
                    }
                }

                query[key] = values.join(',');
                continue;
            }

            query[key] = value;
        }

        try {

            response = await this.#api.request({ ...options, path, method, query, headers : { ...this.defaultHeaders, ...(options.headers ?? {}) } });
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

            this.client.logger.error({
                msg      : `${ this.id } : API error ${ statusCode }`,
                response : body,
                body     : options.body,
                path,
                queryParams,
                statusCode,
                method
            });

            const error = new Error(`${ this.id } : API error ${ statusCode }`);

            error.response = { body, statusCode, headers };

            throw error;
        }

        return body;
    }
}

module.exports = ServiceApi;
