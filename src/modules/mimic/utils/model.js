'use strict';

const Dictionary = require('./dictionary');

module.exports = class Model {

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
};
