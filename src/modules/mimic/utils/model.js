'use strict';

const Dictionary = require('./dictionary');
const State      = require('./state');

class Model {

    /**
     * @typedef {Map<number, number>} Followers
     */

    /**
     * @typedef {Map<string, number>} WordFollowers
     */

    /**
     * @type {Map<number, Followers>}
     */
    states = new Map();

    /**
     * @type {Dictionary}
     */
    dictionary = new Dictionary();

    /**
     * @param {State} state
     *
     * @return {Followers} followers
     */
    get(state) {

        return this.states.get(state.key);
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
     * @return {Followers} followers
     */
    initialize(state) {

        /** @type {Followers} */
        const followers = new Map();

        this.set(state, followers);

        return followers;
    }

    /**
     * @param {State} state
     * @param {Followers} followers
     */
    set(state, followers) {

        this.states.set(state.key, followers);

        return this;
    }

    /**
     * @param {State}  state
     * @param {string} word
     */
    increase(state, word) {

        let followers = this.states.get(state.key);

        if (!followers) {

            followers = this.initialize(state);
        }

        const id = this.dictionary.addWord(word);

        let value = followers.get(id) || 0;

        value++;

        followers.set(id, value);

        return value;
    }

    /**
     * @param {string[]} words
     * @return {State}
     */
    buildState(words) {

        return new State(this.dictionary.toStateValues(words));
    }

    /**
     * @return {IterableIterator<[State.key, WordFollowers]>}
     */
    * entries() {

        for (const [key, followers] of this.states.entries()) {

            yield [key, this.output(followers)];
        }
    }

    /**
     * @return {IterableIterator<[State.key, WordFollowers]>}
     */
    [Symbol.iterator]() {

        return this.entries();
    }

    // serialize() {
    //
    //     const states     = [];
    //     const dictionary = [];
    //
    //     for (const [key, followers] of this.states.entries()) {
    //
    //         if (followers.size !== 0) {
    //
    //             states.push([key, [...followers]]);
    //         }
    //     }
    //
    //     for (const [word, id] of this.dictionary.entries()) {
    //
    //         dictionary.push([word, id]);
    //     }
    //
    //     return { states, dictionary };
    // }
    //
    // static deserialize({ states = [], dictionary = [] } = {}) {
    //
    //     const model = new Model();
    //
    //     model.dictionary = new Dictionary(dictionary);
    //
    //     for (const [key, followers] of states) {
    //
    //         const value = new Map();
    //
    //         for (const [word, weight] of followers) {
    //
    //             value.set(word, weight);
    //         }
    //
    //         model.states.set(key, value);
    //     }
    //
    //     return model;
    // }

    /**
     * @param {Followers} followers
     * @returns {WordFollowers}
     */
    output(followers) {

        if (!followers) {

            return undefined;
        }

        /** @type {WordFollowers} */
        const output = new Map();

        for (const [id, weight] of followers.entries()) {

            output.set(this.dictionary.getWord(id), weight);
        }

        return output;
    }

    /**
     * @param {WordFollowers} followers
     * @returns {Followers}
     */
    input(followers) {

        if (!followers) {

            return undefined;
        }

        /** @type {Followers} */
        const input = new Map();

        for (const [word, weight] of followers.entries()) {

            const id = this.dictionary.addWord(word);

            input.set(id, weight);
        }

        return input;
    }
}

module.exports = Model;
