'use strict';

/**
 * @typedef {Function} Predicate
 * @template U, T
 *
 * @param {T} i
 *
 * @return {U}
 */

module.exports = {

    /**
     * @template U, T
     * @param {Array<T>}  array
     * @param {Number}    chunkSize
     *
     * @return {Array<T>[]}
     */
    chunk(array, chunkSize = 10) {

        return array.reduce((acc, each, index, src) => {

            if (!(index % chunkSize)) {
                return [...acc, src.slice(index, index + chunkSize)];
            }

            return acc;
        }, []);
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayLike
     *
     * @return {Array<T>}
     */
    unique(arrayLike) {

        return Array.from(new Set(arrayLike));
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayLike
     * @param {Predicate} predicate
     *
     * @return {Array<T>}
     */
    uniqueBy(arrayLike, predicate = (i) => i) {

        return Array.from(module.exports.toMap(arrayLike, predicate).values());
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayA
     * @param {Array<T>}  arrayB
     * @param {Predicate} predicate
     *
     * @return {Array<T>}
     */
    union(arrayA, arrayB, predicate = (i) => i) {

        return module.exports.uniqueBy([...arrayA, ...arrayA], predicate);
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayA
     * @param {Array<T>}  arrayB
     * @param {Predicate} predicate
     *
     * @return {Array<T>}
     */
    innerExclusiveJoin(arrayA, arrayB, predicate = (i) => i) {

        const bIds = arrayB.map(predicate);

        return arrayA.filter((i) => bIds.includes(predicate(i)));
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayA
     * @param {Array<T>}  arrayB
     * @param {Predicate} predicate
     *
     * @return {Array<T>}
     */
    leftExclusiveJoin(arrayA, arrayB, predicate = (i) => i) {

        const bIds = arrayB.map(predicate);

        return arrayA.filter((i) => !bIds.includes(predicate(i)));
    },

    /**
     * @template U, T
     * @param {Array<T>}  arrayA
     * @param {Array<T>}  arrayB
     * @param {Predicate} predicate
     *
     * @return {Array<T>}
     */
    rightExclusiveJoin(arrayA, arrayB, predicate = (i) => i) {

        return module.exports.leftExclusiveJoin(arrayB, arrayA, predicate);
    },

    /**
     * @template T, U
     *
     * @param {Array<T>}   array
     * @param {Predicate}  predicate
     *
     * @return {Map<U, T>}
     */
    toMap(array, predicate = (i) => i) {

        return Array.from(array).reduce((map, item) => {

            map.set(predicate(item), item);

            return map;

        }, new Map());
    }
};
