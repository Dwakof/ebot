'use strict';

const Lunr         = require('lunr');
const { DateTime } = require('luxon');
const CurrencyJS   = require('currency.js');

const { ServiceApi, Util } = require('../../../core');

module.exports = class CurrencyService extends ServiceApi {

    static ENDPOINT = 'https://api.apilayer.com/';

    /**
     * @type {Map<CurrencyCode, Currency>}
     */
    #currencies = new Map();

    #index;

    async init(settings) {

        super.init(settings);

        this.defaultHeaders = { apikey : settings.freeCurrencyApi.apiKey };

        const { rates } = await this.getRates();

        const Symbols    = require('../resources/symbols').reduce((agg, { code, symbol }) => ({ ...agg, [code] : symbol }), {});
        const Currencies = require('../resources/currencies')
            .reduce((agg, currency) => ({ ...agg, [currency.code] : { ...currency, symbol : Symbols[currency.code] ?? currency.code } }), {});

        for (const currency of Object.values(Currencies)) {

            if (currency.code === 'USD' || Util.isNumber(rates[currency.code])) {

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
     * @param {CurrencyCode} [currency=USD]
     * @param {Object}       [queryOptions={}]
     *
     * @return {Promise<RateResponse>}
     */
    getRates(currency = 'USD', queryOptions = {}) {

        return this.api.get('/fixer/latest', { base : currency, ...queryOptions });
    }

    /**
     * @param {CurrencyCode}          [currency=USD]
     * @param {Date|Number|DateTime}  [from=new Date()-30d]
     * @param {Date|Number|DateTime}  [to=new Date()]
     * @param {Array<CurrencyCode>}   [currencies]
     * @param {Object}                [queryOptions={}]
     *
     * @return {Promise<HistoryResponse>}
     */
    getHistory(currency = 'USD', from, to, currencies, queryOptions = {}) {

        const start_date = new DateTime(from ?? DateTime.now().minus({ month : 1 })).toISODate();
        const end_date   = new DateTime(to ?? DateTime.now()).toISODate();

        return this.api.get('/fixer/timeseries', { base : currency, start_date, end_date, symbols : currencies, ...queryOptions });
    }

    /**
     * @param {CurrencyCode}          [currency=USD]
     * @param {Date|Number|DateTime}  [from=new Date()-30d]
     * @param {Date|Number|DateTime}  [to=new Date()]
     * @param {Array<CurrencyCode>}   [currencies]
     * @param {Object}                [queryOptions={}]
     *
     * @return {Promise<HistoryResponse>}
     */
    async getLongerHistory(currency = 'USD', from, to, currencies, queryOptions = {}) {

        const start_date = new DateTime(from ?? DateTime.now().minus({ month : 1 }));
        const end_date   = new DateTime(to ?? DateTime.now());

        if (end_date.diff(start_date, 'days').toObject().days <= 365) {

            return this.getHistory(currency, from, to, currencies, queryOptions);
        }

        /**
         * @type {Map<IsoDate, RateObject>}
         */
        const rates = new Map();

        let _start_date = start_date;
        let _end_date   = start_date.plus({ day : 365 });

        while (_end_date.toMillis() < end_date.toMillis()) {

            const { rates : _rates } = await this.getHistory(currency, _start_date, _end_date, currencies, queryOptions);

            for (const [date, rate] of Object.entries(_rates)) {

                rates.set(date, rate);
            }

            _start_date = _start_date.plus({ day : 365 });
            _end_date   = _end_date.plus({ day : 365 });

            if (_end_date.toMillis() > end_date.toMillis()) {

                _end_date = end_date;
            }
        }

        /**
         * @type {IsoDate[]}
         */
        const times = Array.from(rates.keys()).sort((a, b) => a.localeCompare(b));

        return { rates : Object.fromEntries(rates), start_date : times.shift(), end_date : times.pop(), base : currency };
    }

    /**
     * @param {Currency} from
     * @param {Currency} to
     * @param {Number}   amount
     *
     * @return {Promise<{result: String, amount: Number, value: Number, rate: Number, from : Currency, to : Currency}>}
     */
    async convert(from, to, amount) {

        const { rates } = await this.getRates(from.code);

        const value = this._convert(amount, rates[to.code]);

        return { from, to, amount, value, rate : rates[to.code], result : this.format(value, to) };
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
     * @return {Currency[]}
     */
    autocomplete(query) {

        return this.#index.query((q) => {
            // exact matches should have the highest boost
            q.term(query, { boost : 100 });

            // prefix matches should be boosted slightly
            q.term(query, { boost : 10, usePipeline : false, wildcard : Lunr.Query.wildcard.TRAILING });

            // finally, try a fuzzy search, without any boost
            q.term(query, { boost : 1, usePipeline : false, editDistance : 1 });
        }).map(({ ref }) => this.#currencies.get(ref));
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

        return Array.from(this.#currencies.values()).sort((a, b) => a.code.localeCompare(b.code));
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
     * @typedef {Object<CurrencyCode, Number>} RateObject
     */

    /**
     * @typedef {Object} RateResponse
     *
     * @property {CurrencyCode} base
     *
     * @property {RateObject} rates
     */

    /**
     * @typedef {Object} HistoryResponse
     *
     * @property {CurrencyCode} base
     * @property {IsoDate}      start_date
     * @property {IsoDate}      end_date
     *
     * @property {Object<IsoDate, RateObject>} rates
     */
};
