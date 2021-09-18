'use strict';

module.exports = class State {

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

        return new State(array.map(State.cleanUpWord).join(State.SEPARATOR), array);
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


    /**
     * @param {string} word
     *
     * @return {string}
     */
    static cleanUpWord(word) {

        return word.replace(/["'_~|(),><.?$!`{}=+*\[\]]/g, '').toLowerCase().trim();
    }
};
