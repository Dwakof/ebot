'use strict';

class State {

    /** @type {number} */
    key;

    /** @type {number[]} */
    values;

    /**
     * @param {Array<number>} values
     */
    constructor(values) {

        this.values = values;
        this.key    = State.cantorPairOrder(values);
    }

    /**
     * @param {number} x
     * @param {number} y
     * @returns {number}
     */
    static cantorPair(x, y) {

        return (0.5 * (x + y) * (x + y + 1)) + y;
    }

    /**
     * @param {number} z
     * @returns {[number, number]}
     */
    static inverseCantorPair(z) {

        const w = Math.floor((Math.sqrt(1 + 8 * z) - 1) / 2);

        const t = (w * (w + 1)) / 2;

        const y = z - t;
        const x = w - y;

        return [x, y];
    }

    /**
     * @param {number[]} values
     *
     * @return {number}
     */
    static cantorPairOrder(values) {

        if (values.length === 1) {

            return values[0]; // A single value doesn't need pairing
        }

        let hash = State.cantorPair(values[0], values[1]);

        for (let i = 2; i < values.length; ++i) {

            hash = State.cantorPair(hash, values[i]);
        }

        return hash;
    }

    /**
     * @param {number} hash
     * @param {number} order
     * @return {number[]}
     */
    static inverseSzudzikPairOrder(hash, order) {

        const values = [];

        for (let i = 0; i < order - 1; ++i) {

            const [x, y] = State.inverseCantorPair(hash);

            values.push(y);
            hash = x;
        }

        values.push(hash);

        return values.reverse();
    }

    /**
     * @param {number|State.key} key
     * @param {number}           order
     *
     * @return {State} state
     */
    static fromKey(key, order) {

        return new State(State.inverseSzudzikPairOrder(key, order));
    }

    /**
     * @param {State} stateA
     * @param {State} stateB
     *
     * @return {boolean}
     */
    static equal(stateA, stateB) {

        return stateA.key === stateB.key;
    }

    // /**
    //  * @param {string} word
    //  *
    //  * @return {string}
    //  */
    // static cleanUpWord(word) {
    //
    //     return word.replace(/["'_~|(),><.?$!`{}=+*\[\]]/g, '').toLowerCase().trim();
    // }
}

module.exports = State;
