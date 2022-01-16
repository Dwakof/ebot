'use strict';

module.exports = {

    /**
     * Returns a random integer between the specified values. The value is no lower than min
     * (or the next integer greater than min if min isn't an integer), and is less than (but
     * not equal to) max.
     */
    randomNumber(min = 0, max = 1) {

        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {

        return Math.round(module.exports.randomNumber(min, max));
    },

    randomValue(array = []) {

        return array[module.exports.randomInt(0, array.length - 1)] || undefined;
    }
};
