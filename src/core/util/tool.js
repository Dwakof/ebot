'use strict';

const Util = require('util');

const { isValidObject } = require('./is');

module.exports = {

    PromiseProps(props) {

        return Promise.all(Object.values(props))
            .then((values) => Object.keys(props).reduce((acc, prop, index) => ({ ...acc, [prop] : values[index] }), {}));
    },

    flattenKeys(obj, separator = '.') {

        const walker = (child, path = []) => {

            return Object.assign({}, ...Object.keys(child).map((key) => {

                if (key.startsWith('$')) {

                    return { [path.concat([key.slice(1)]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
                }

                if (isValidObject(child[key])) {

                    return walker(child[key], path.concat([key]));
                }

                return { [path.concat([key]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
            }));
        };

        return Object.assign({}, walker(obj));
    },

    chunk(array, chunkSize = 10) {

        return array.reduce((acc, each, index, src) => {

            if (!(index % chunkSize)) {
                return [...acc, src.slice(index, index + chunkSize)];
            }

            return acc;
        }, []);
    },

    wait : Util.promisify(setTimeout),

    debounce(func, timeout = 300) {

        let interval;

        return (...args) => {

            clearTimeout(interval);

            interval = setTimeout(() => func(...args), timeout);
        };
    },

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    },

    padLeftString(value, maxValue, padChar = ' ') {

        return `${ value }`.padStart(`${ maxValue }`.length, padChar);
    },

    max(values = [], accessor = (v) => v) {

        return values.reduce((acc, value) => Math.max(acc, accessor(value)), accessor(values[0]));
    },

    sum(values = [], accessor = (v) => v) {

        return values.reduce((acc, value) => acc + accessor(value), 0);
    },

    normalize(values = [], factor = 100, attribute = null) {

        const max = this.max(values, attribute ? (v) => v[attribute] : undefined);

        return values.map((value) => {

            const normalized = value[attribute] / max * factor;

            if (attribute) {

                return { ...value, [attribute] : normalized };
            }

            return normalized;
        });
    },

    ordinal(value) {

        const suffix = ['th', 'st', 'nd', 'rd'];
        const modulo = value % 100;

        return value + (suffix[(modulo - 20) % 10] || suffix[modulo] || suffix[0]);
    },

    memoize(fn) {

        const cache = {};

        return (...args) => {

            const n = args[0];

            if (n in cache) {

                return cache[n];
            }

            cache[n] = fn(n);

            return cache[n];
        };
    }
};
