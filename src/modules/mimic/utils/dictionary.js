'use strict';

module.exports = class Dictionary {

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

        return this.words.entries();
    }
};
