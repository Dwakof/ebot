'use strict';

const Service = require('../../../core/service');

module.exports = class MimicService extends Service {

    async mimicUser(guildId, userId, initialState) {

        const { Mimic } = this.client.providers('mimic');

        const { Model } = Mimic.models;

        const { model : json } = await Model.query().findById([guildId, userId]).throwIfNotFound();

        const model = Chain.fromJSON(json);

        return model.walk(initialState).join(' ');
    }
};

class State {

    static SEPARATOR = '|';

    key;
    value;

    /**
     * @param {String} key
     * @param {Array<String>} value
     */
    constructor(key, value) {

        this.key   = key;
        this.value = value;
    }

    /**
     * @param {Array<String>|State.value} array
     *
     * @return {State} state
     */
    static fromValue(array) {

        return new State(array.join(State.SEPARATOR), array);
    }

    /**
     * @param {String|State.key} key
     *
     * @return {State} state
     */
    static fromKey(key) {

        return new State(key, key.split(State.SEPARATOR));
    }

    /**
     *
     * @param {State} stateA
     * @param {State} stateB
     *
     * @return {boolean}
     */
    static equal(stateA, stateB) {

        return stateA.key === stateB.key;
    }
}

class Dictionary {

    /**
     * @type {Map<String, Number>}
     */
    words = new Map();

    /**
     * @type {Map<Number, String>}
     */
    reverse = new Map();

    /**
     * @param mapping
     */
    constructor(mapping = []) {

        for (const [word, id] of mapping) {

            this.words.set(word, id);
            this.reverse.set(id, word);
        }
    }

    addWord(word) {

        let id = this.words.get(word);

        if (id) {

            return id;
        }

        id = this.words.size;

        this.words.set(word, id);
        this.reverse.set(id, word);

        return id;
    }

    hasWord(word) {

        return this.words.has(word);
    }

    hasId(id) {

        return this.reverse.has(id);
    }

    getId(word) {

        return this.words.get(word);
    }

    getWord(id) {

        return this.reverse.get(id);
    }

    /**
     * @return {Iterator<[String, Number]>}
     */
    entries() {

        return this.words.entries();
    }

    /**
     * @return {IterableIterator<[String, Number]>}
     */
    [Symbol.iterator]() {

        return this.words.entries()
    }
}

class Model {

    /**
     * @type {Map<State.key, Map<Number, Number>>}
     */
    states = new Map();

    /**
     * @type {Dictionary}
     */
    dictionary = new Dictionary();

    /**
     * @param {State} state
     *
     * @return Map<String, Number> followers
     */
    get(state) {

        return this.output(this.states.get(state.key));
    }

    /**
     * @param {State} state
     *
     * @return {boolean}
     */
    has(state) {

        return this.states.has(state.key);
    }

    /**
     * @param {State} state
     *
     * @return {Map<String, Number>} followers
     */
    initialize(state) {

        for (const word of state.value) {

            this.dictionary.addWord(word);
        }

        const followers = new Map();

        this.set(state, followers);

        return followers;
    }

    /**
     * @param {State} state
     * @param {Map<String, Number>} followers
     */
    set(state, followers) {

        this.states.set(state.key, this.input(followers));

        return this;
    }

    /**
     * @param {State}  state
     * @param {String} word
     */
    increase(state, word) {

        let followers = this.states.get(state.key);

        if (!followers) {

            followers = this.initialize(state);
        }

        const index = this.dictionary.addWord(word);

        let value = followers.get(index) || 0;

        value++;

        followers.set(index, value);

        this.states.set(state.key, followers);

        return value;
    }

    /**
     * @return {IterableIterator<[State.key, Map<String, Number>]>}
     */
    * entries() {

        for (const [key, followers] of this.states.entries()) {

            yield [key, this.output(followers)];
        }
    }

    /**
     * @return {IterableIterator<[State.key, Map<String, Number>]>}
     */
    [Symbol.iterator]() {

        return this.entries();
    }

    serialize() {

        const states     = [];
        const dictionary = [];

        for (const [key, followers] of this.states.entries()) {

            if (followers.size !== 0) {

                states.push([key, [...followers]]);
            }
        }

        for (const [word, id] of this.dictionary.entries()) {

            dictionary.push([word, id]);
        }

        return { states, dictionary };
    }

    static deserialize({ states = [], dictionary = [] } = {}) {

        const model = new Model();

        model.dictionary = new Dictionary(dictionary);

        for (const [key, followers] of states) {

            const value = new Map();

            for (const [word, weight] of followers) {

                value.set(word, weight);
            }

            model.states.set(key, value);
        }

        return model;
    }

    output(followers) {

        if (!followers) {

            return followers;
        }

        const output = new Map();

        for (const [id, weight] of followers.entries()) {

            output.set(this.dictionary.getWord(id), weight);
        }

        return output;
    }

    input(followers) {

        const input = new Map();

        for (const [word, weight] of followers.entries()) {

            let index = this.dictionary.get(word);

            if (!index) {

                index = this.dictionary.size;

                this.dictionary.set(word, index);
            }

            input.set(index, weight);
        }

        return input;
    }
}

class Chain {

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
     * @type {Map<String, Array>}
     */
    compiledModel;

    /**
     * @type {Array<Array>}
     */
    beginCache;

    /**
     *
     * @param {Number} [order=3]
     * @param {Model}  [model]
     */
    constructor(order = 3, model) {

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

                const words = sentence.replace(/"'_~\|\(\),`/g, ' ').split(/\s+/);

                const items = [
                    ...this.beginStateValue,
                    ...words.filter((word) => ![Chain.END, Chain.BEGIN].includes(word)),
                    Chain.END
                ];

                for (let i = 0; i < words.length + 1; i++) {

                    const state  = State.fromValue(items.slice(i, i + this.order));
                    const follow = items[i + this.order];

                    this.model.increase(state, follow);
                }
            }

            return this;
        }

        if (typeof corpus === 'string' || corpus instanceof String) {

            return this.build([corpus]);
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

        let choices;
        let cumdist;

        ([choices, cumdist] = Chain.compileNext(this.model.get(state)));

        const random = Math.random() * cumdist.slice(-1);
        return choices[Chain.bisect(cumdist, random)];
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

            const items = [...this.beginStateValue, ...words.filter((word) => ![Chain.END, Chain.BEGIN].includes(word))];

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

        } while (word !== Chain.END)
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
     * @param {operand}  operand
     *
     * @return {Array<T>}
     */
    static accumulate(array, operand = (total, elem) => total + elem) {

        return array.reduce((acc, value) => {

            acc.total = operand(acc.total, value);
            acc.results.push(acc.total);

            return acc;

        }, { total : 0, results : [] }).results;
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
}
