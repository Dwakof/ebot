'use strict';

const State = require('./state');

const MAX_ID = Math.min(...State.inverseCantorPair(Number.MAX_SAFE_INTEGER));

class Dictionary extends Map {

    /**
     * @type {Map<string, number>}
     */
    words = new Map();

    /**
     * @type {string[]}
     */
    reverse = [];

    /**
     * @param {Array<[string, number]>} mapping
     */
    constructor(mapping = []) {

        super();

        for (const [word, id] of mapping) {

            if (id >= MAX_ID) {

                throw new Error('Max number of words per dictionary reached');
            }

            this.words.set(word, id);
            this.reverse[id] = word;
        }
    }

    set(word, id) {

        this.words.set(word, id);
        this.reverse[id] = word;
    }

    /**
     * @param {string} word
     * @returns {number}
     */
    addWord(word) {

        let id = this.getId(word);

        if (id) {

            return id;
        }

        id = this.words.size + 1;

        if (id >= MAX_ID) {

            throw new Error('Max number of words per dictionary reached');
        }

        this.words.set(word, id);
        this.reverse[id] = word;

        return id;
    }

    getId(word) {

        return this.words.get(word);
    }

    getWord(id) {

        return this.reverse[id];
    }

    /**
     * @param {string[]} words
     * @returns {number[]}
     */
    toStateValues(words) {

        return words.map((word) => this.addWord(word));
    }

    /**
     * @return {IterableIterator<[string, number]>}
     */
    entries() {

        return this.words.entries();
    }

    /**
     * @return {IterableIterator<[string, number]>}
     */
    [Symbol.iterator]() {

        return this.words.entries();
    }
}

module.exports = Dictionary;
