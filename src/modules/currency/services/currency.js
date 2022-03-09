'use strict';

const { Client }   = require('undici');
const Lunr         = require('lunr');
const { DateTime } = require('luxon');
const CurrencyJS   = require('currency.js');

const { Service }  = require('../../../core');
const { isNumber } = require('chart.js/helpers');

module.exports = class CurrencyService extends Service {

    /**
     * @type {Map<CurrencyCode, Currency>}
     */
    #currencies = new Map();

    static ENDPOINT = 'https://api.currencyapi.com';

    #api;
    #apiKey;
    #defaultQuery = {};
    #index;

    async init() {

        this.#api = new Client(CurrencyService.ENDPOINT);

        this.#apiKey = this.client.settings.plugins.currency.freeCurrencyApi.apiKey;

        const rates = await this.getRates();

        const Symbols    = require('../resources/symbols').reduce((agg, { code, symbol }) => ({ ...agg, [code] : symbol }), {});
        const Currencies = require('../resources/currencies')
            .reduce((agg, currency) => ({ ...agg, [currency.code] : { ...currency, symbol : Symbols[currency.code] ?? currency.code } }), {});

        for (const currency of Object.values(Currencies)) {

            if (currency.code === 'USD' || isNumber(rates[currency.code]?.value)) {

                this.#currencies.set(currency.code, currency);
            }
        }

        const currencies = this.#currencies;

        this.#index = Lunr(function () {

            this.ref('code');
            this.field('code');
            this.field('currency');
            this.field('countries');

            this.pipeline.remove(Lunr.stemmer);
            this.searchPipeline.remove(Lunr.stemmer);

            for (const currency of currencies.values()) {

                this.add({ ...currency, countries : currency.countries.join(' ') });
            }
        });
    }

    /**
     * @param {String} method
     * @param {String} path
     * @param {Object} [queryParams={}]
     *
     * @return {Promise<Object>}
     */
    async #call(method, path, queryParams = {}) {

        const response = await this.#api.request({
            path    : `${ path }?${ new URLSearchParams({ ...this.#defaultQuery, ...queryParams }) }`,
            headers : { apikey : this.#apiKey },
            method
        });

        const { body, statusCode } = response;

        if (statusCode >= 400) {

            this.client.logger.error({
                msg      : `FreeCurrency API error ${ statusCode }`,
                response : await body.json(),
                queryParams, method, statusCode
            });

            const error = new Error(`FreeCurrency API error ${ statusCode }`);

            error.response = response;

            throw error;
        }

        return body.json();
    }

    /**
     * @param {CurrencyCode} [currency=USD]
     * @param {Object}       [queryOptions={}]
     *
     * @return {Promise<Record<CurrencyCode, RateObject>>}
     */
    async getRates(currency = 'USD', queryOptions = {}) {

        const { data } = await this.#call('GET', '/v3/latest', { base_currency : currency, ...queryOptions });

        return data;
    }

    /**
     * @param {CurrencyCode}  [currency=USD]
     * @param {Date|Number}   [from=new Date()-30d]
     * @param {Date|Number}   [to=new Date()]
     * @param {Object}        [queryOptions={}]
     *
     * @return {Promise<HistoryResponse>}
     */
    getHistory(currency = 'USD', from, to, queryOptions = {}) {

        const datetime_start = new DateTime(from ?? DateTime.now().minus({ month : 1 })).toISODate();
        const datetime_end   = new DateTime(to ?? DateTime.now()).toISODate();

        return this.#call('GET', '/v3/range', { base_currency : currency, datetime_start, datetime_end, ...queryOptions });
    }

    /**
     * @param {Currency} from
     * @param {Currency} to
     * @param {Number}   amount
     *
     * @return {Promise<{result: String, amount: Number, value: Number, rate: Number, from : Currency, to : Currency}>}
     */
    async convert(from, to, amount) {

        const rates = await this.getRates(from.code);

        const value = this._convert(amount, rates[to.code].value);

        return { from, to, amount, value, rate : rates[to.code].value, result : this.format(value, to) };
    }

    /**
     * @param {Number}       amount
     * @param {Number}       rate
     *
     * @return {number}
     */
    _convert(amount, rate) {

        return CurrencyJS(amount, { precision : 10 }).multiply(rate).value;
    }

    /**
     * @param {Number}   value
     * @param {Currency} [currency]
     *
     * @return {String}
     */
    format(value, currency) {

        if (!currency) {

            return CurrencyJS(value, { separator : ' ', symbol : '', decimal : '.', precision : 2 }).format();
        }

        return CurrencyJS(value, { separator : ' ', symbol : currency.symbol, decimal : '.', precision : currency.digits ?? 2, pattern : '# !' }).format();
    }

    /**
     *
     * @param {String} query
     *
     * @return {Currency[]}
     */
    search(query) {

        return this.#index.search(query).map(({ ref }) => this.#currencies.get(ref));
    }

    /**
     *
     * @param {String} query
     *
     * @return {Currency}
     */
    find(query) {

        return this.search(query)[0];
    }

    list() {

        return Array.from(this.#currencies.values());
    }

    /**
     * @typedef {Object} Currency
     *
     * @property {CurrencyCode} code
     * @property {String}       currency
     * @property {String[]}     countries
     * @property {Number}       digits
     * @property {Number}       number
     * @property {String}       symbol
     */

    /**
     * @typedef {String} CurrencyCode
     */

    /**
     * @typedef {String} IsoDate
     */

    /**
     * @typedef {Object} RateObject
     *
     * @property {CurrencyCode} code
     * @property {Number} value
     */

    /**
     * @typedef {Object} RateResponse
     *
     * @property {Object} query
     * @property {Number} query.timestamp
     * @property {String} query.base_currency
     *
     * @property {Object<CurrencyCode, RateObject>} data
     */

    /**
     * @typedef {Object} HistoryRate
     *
     * @property {IsoDate}                           datetime
     * @property {Object<CurrencyCode, RateObject>}  currencies
     */

    /**
     * @typedef {Object} HistoryResponse
     *
     * @property {Object} query
     * @property {Number} query.timestamp
     * @property {String} query.base_currency
     *
     * @property {Array<HistoryRate>} data
     */
};
