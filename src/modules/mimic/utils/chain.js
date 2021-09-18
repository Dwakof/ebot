'use strict';

const { Util } = require('../../../core');

const State = require('./state');
const Model = require('./model');

module.exports = class Chain {

    static BEGIN = '___BEGIN___';
    static END   = '___END___';

    /**
     * @type {Number}
     */
    order;

    /**
     * @type {boolean}
     */
    compiled;

    /**
     * @type {Model}
     */
    model;

    /**
     *
     * @param {Number} [order=3]
     * @param {Model}  [model]
     */
    constructor(order = 2, model) {

        this.order = order;

        if (model) {

            this.model = model;
        }
        else {

            this.model = new Model();
        }

        this.compiled = false;
    }

    /**
     * @param {Array<String>|Buffer|String} corpus
     *
     * @return {Chain}
     */
    build(corpus) {

        if (Array.isArray(corpus)) {

            for (const sentence of corpus) {

                const words = sentence
                    .replace(new RegExp(Util.REGEX_URL), ' ')
                    .replace(new RegExp(Util.REGEX_CODE_BLOCK), ' ')
                    .replace(/["_~\\()|,.\[\-$%`{}=+*\]]+/g, ' ')
                    .split(/\s+/)
                    .map((word) => word.trim())
                    .filter((word) => ![Chain.END, Chain.BEGIN].includes(word))
                    .filter(Boolean);

                if (words.length < 1) {

                    continue;
                }

                const items = [...this.beginStateValue, ...words, Chain.END];

                for (let i = 0; i < words.length + 1; i++) {

                    const state  = State.fromValue(items.slice(i, i + this.order));
                    const follow = items[i + this.order];

                    this.model.increase(state, follow);
                }
            }

            return this;
        }

        if (typeof corpus === 'string' || corpus instanceof String) {

            return this.build(corpus.split(/\R+/));
        }

        if (Buffer.isBuffer(corpus)) {

            return this.build([corpus.toString()]);
        }
    }

    /**
     * @param {State} state
     *
     * @return {String} word
     */
    move(state) {

        const [choices, { results : cumdist }] = Chain.compileNext(this.model.get(state));

        return choices[Chain.bisect(cumdist, Math.random() * cumdist.slice(-1))];
    }

    /**
     * @param {State|String} [initState]
     *
     * @return {Generator<String, void, *>}
     */
    * gen(initState = this.beginState) {

        let state = initState;

        if (typeof state === 'string' || state instanceof String) {

            const words = state.split(/\s+/);

            const items = [
                ...this.beginStateValue,
                ...words.filter((word) => ![Chain.END, Chain.BEGIN].includes(word))
            ];

            state = State.fromValue(items.slice(-1 * this.order));

            if (this.model.has(state)) {

                yield * words;
            }
            else {

                state = this.beginState;
            }
        }

        let word;

        do {

            word = this.move(state);

            if (word !== Chain.END) {

                yield word;

                state = State.fromValue([...state.value.slice(1), word]);
            }

        } while (word !== Chain.END);
    }

    /**
     * @param {State|String} [initState]
     *
     * @return {String[]}
     */
    walk(initState) {

        return [...this.gen(initState)];
    }

    /**
     * return {Object} serialized object
     */
    toJSON() {

        return { order : this.order, model : this.model.serialize() };
    }

    /**
     * @param {String|Buffer|Object} object
     *
     * @return {Chain} chain
     */
    static fromJSON(object) {

        if (Buffer.isBuffer(object)) {

            return Chain.fromJSON(object.toString());
        }

        if (typeof object === 'string' || object instanceof String) {

            return Chain.fromJSON(JSON.parse(object));
        }

        const model = Model.deserialize(object.model);

        return new Chain(object.order, model);
    }

    get beginStateValue() {

        return Array(this.order).fill(Chain.BEGIN);
    }

    get beginState() {

        return State.fromValue(this.beginStateValue);
    }

    /**
     * @param {Map} map
     *
     * @return {Array}
     */
    static compileNext(map) {

        return [Array.from(map.keys()), Chain.accumulate(Array.from(map.values()))];
    }

    /**
     * @callback operand
     * @template T
     * @param {T} total
     * @param {T} elem
     * @return {T}
     */

    /**
     * @template T
     * @param {Array<T>} array
     *
     * @return {Array<T>}
     */
    static accumulate(array) {

        return array.reduce((acc, value) => {

            acc.total = acc.total + Chain.operand(value);
            acc.results.push(acc.total);

            return acc;

        }, { total : 0, results : [] });
    }

    /**
     * returns an insertion point which comes after (to the right of) any existing entries of `value` in `array`.
     *
     * @template T
     * @param {Array<T>} array
     * @param {T} value
     * @param {Number} [low=0]
     * @param {Number} [high=null]
     *
     * @return {Number} index
     */
    static bisect(array, value, low = 0, high = null) {

        if (high === null) {

            high = array.length;
        }

        while (low < high) {

            const middle = Math.floor((low + high) / 2);

            if (value < array[middle]) {

                high = middle;
            }
            else {

                low = middle + 1;
            }
        }

        return low;
    }

    static operand = Util.memoize((v) => (Math.round(10 * Math.log(v) / Math.LN10) || 1));
};
