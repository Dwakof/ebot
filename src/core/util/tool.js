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

    wait : Util.promisify(setTimeout),

    debounce(func, timeout = 300) {

        let interval;

        return (...args) => {

            clearTimeout(interval);

            interval = setTimeout(() => func(...args), timeout);
        };
    },

    /**
     * @param {String} string
     * @return {String}
     */
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
    },

    dedent(templateStrings, ...values) {

        const matches = [];
        const strings = typeof templateStrings === 'string' ? [templateStrings] : templateStrings.slice();

        // 1. Remove trailing whitespace.
        strings[strings.length - 1] = strings[strings.length - 1].replace(/\r?\n([\t ]*)$/, '');

        // 2. Find all line breaks to determine the highest common indentation level.
        for (let i = 0; i < strings.length; ++i) {
            let match;

            // noinspection JSAssignmentUsedAsCondition
            if (match = strings[i].match(/\n[\t ]+/g)) {
                matches.push(...match);
            }
        }

        // 3. Remove the common indentation from all strings.
        if (matches.length) {
            const size    = Math.min(...matches.map((value) => value.length - 1));
            const pattern = new RegExp(`\n[\t ]{${size}}`, 'g');

            for (let i = 0; i < strings.length; ++i) {
                strings[i] = strings[i].replace(pattern, '\n');
            }
        }

        // 4. Remove leading whitespace.
        strings[0] = strings[0].replace(/^\r?\n/, '');

        // 5. Perform interpolation.
        let string = strings[0];

        for (let i = 0; i < values.length; ++i) {
            string += values[i] + strings[i + 1];
        }

        return string;
    },

    paragraphText(text, maxLength = 1000) {

        return text.split('\n').reduce((acc, block) => {

            if (acc[acc.length - 1].length + block.length > maxLength) {

                acc.push('');
            }

            if (block.length > maxLength) {

                for (const sentence of block.split('.')) {

                    if (acc[acc.length - 1].length + sentence.length > maxLength) {

                        acc.push('');
                    }

                    acc[acc.length - 1] = acc[acc.length - 1].concat('.', block);
                }

                return acc;
            }

            acc[acc.length - 1] = acc[acc.length - 1].concat('\n', block);

            return acc;

        }, ['']);
    }
};
