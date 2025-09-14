'use strict';

const { Util } = require('../../../core');

const Zstd = require('@mongodb-js/zstd');

const State = require('./state');
const Model = require('./model');

const Encoder = require('./encoder.mts');

class Chain {

    static BEGIN = '¶BEGIN¶';
    static END   = '¶END¶';

    static operand = Util.memoize((v) => (Math.round(10 * Math.log(v) / Math.LN10) || 1));

    /**
     * @type {number}
     */
    order;

    /**
     * @type {Model}
     */
    model;

    /**
     *
     * @param {number} [order=2]
     * @param {Model}  [model]
     */
    constructor(order = 2, model) {

        this.order = order;

        if (model) {

            this.model = model;
        }
        else {

            this.model = new Model();

            this.model.dictionary.addWord(Chain.BEGIN);
        }
    }

    get beginStateValue() {

        return Array(this.order).fill(Chain.BEGIN);
    }

    get beginState() {

        return this.model.buildState(this.beginStateValue);
    }

    /**
     * @private
     * @param {import('./encoder.mts').Chain & import('./encoder.mjs').BebopRecord} chain
     * @returns {Chain}
     */
    static fromBebopObject(chain) {

        const model = new Model();

        model.states = chain.model.states;

        for (const [word, id] of chain.model.dictionary) {

            model.dictionary.set(word, id);
        }

        return new Chain(chain.order, model);
    }

    /**
     * @param {string} string
     *
     * @return {Chain}
     */
    static fromJSON(string) {

        return Chain.fromBebopObject(Encoder.Chain.fromJSON(string));
    }

    /**
     * @param {Buffer} buffer
     * @returns {Promise<Chain>}
     */
    static async decode(buffer) {

        const data = await Zstd.decompress(buffer);

        return Chain.fromBebopObject(Encoder.Chain.decode(data));
    }

    /**
     * @template T,V
     * @param {Map<T,V>} map
     *
     * @return {[T[], { total : number, results : number[] }]}
     */
    static compileNext(map) {

        return [Array.from(map.keys()), Chain.accumulate(Array.from(map.values()))];
    }

    /**
     * @template T
     * @param {Array<T>} array
     *
     * @return {{ total : number, results : number[] }}
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
     * @param {Array<T>}    array
     * @param {T}           value
     * @param {number}      [low=0]
     * @param {number|null} [high=null]
     *
     * @return {number} index
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

    /**
     * @param {Array<string>|Buffer|string} corpus
     *
     * @return {Chain}
     */
    build(corpus) {

        if (Array.isArray(corpus)) {

            for (const sentence of corpus) {

                const words = sentence
                    .replace(new RegExp(Util.REGEX_URL), ' ')
                    .replace(new RegExp(Util.REGEX_CODE_BLOCK), ' ')
                    .replace(/["_~\\()¶|,.\[\-$%`{}=+*\]]/g, ' ')
                    .split(/\s+/)
                    .map((word) => word.trim())
                    .filter((word) => ![Chain.END, Chain.BEGIN].includes(word))
                    .filter(Boolean);

                if (words.length < 1) {

                    continue;
                }

                const items = [...this.beginStateValue, ...words, Chain.END];

                for (let i = 0; i < words.length + 1; ++i) {

                    const state  = this.model.buildState(items.slice(i, i + this.order));
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
     * @return {number} id
     */
    move(state) {

        const [choices, { results : cumdist }] = Chain.compileNext(this.model.get(state));

        return choices[Chain.bisect(cumdist, Math.random() * cumdist.slice(-1))];
    }

    /**
     * @param {State|string} [initState]
     *
     * @return {Generator<string, void, *>}
     */
    * gen(initState = this.beginState) {

        let state = initState;

        const ending = this.model.dictionary.getId(Chain.END);

        if (typeof state === 'string' || state instanceof String) {

            const words = state.split(/\s+/);

            const items = [
                ...this.beginStateValue,
                ...words.filter((word) => ![Chain.END, Chain.BEGIN].includes(word))
            ];

            state = this.model.buildState(items.slice(-1 * this.order));

            if (this.model.has(state)) {

                yield * words;
            }
            else {

                state = this.beginState;
            }
        }

        let wordId;

        do {

            wordId = this.move(state);

            if (wordId !== ending) {

                yield this.model.dictionary.getWord(wordId);

                state = new State([...state.values.slice(1), wordId]);
            }

        } while (wordId !== ending);
    }

    /**
     * @param {State|string} [initState]
     *
     * @return {string[]}
     */
    walk(initState) {

        return [...this.gen(initState)];
    }

    /**
     * @callback operand
     * @template T
     * @param {T} total
     * @param {T} elem
     * @return {T}
     */

    /**
     * @private
     * @returns {import('./encoder.mts').Chain}
     */
    getEncoder() {

        return Encoder.Chain({
            order : this.order,
            model : {
                states     : this.model.states,
                dictionary : this.model.dictionary.words
            }
        });
    }

    /**
     * @return {string} serialized object
     */
    stringify() {

        return this.getEncoder().stringify();
    }

    /**
     * @returns {Promise<Buffer>}
     */
    encode() {

        return Zstd.compress(this.getEncoder().encode(), 10);
    }
}

module.exports = Chain;
