'use strict';

const Color = require('chroma-js');

const scales = new Map(Object.entries(Color.brewer));

scales.set('github', [Color('#2F3136').darken(0.2).hex(), '#0e4429', '#006d32', '#26a641', '#39d353']);
scales.set('discord', [Color('#2F3136').darken(0.2).hex(), '#404EED']);

const keys = Array.from(scales.keys());

Color.brewer = new Proxy({}, {
    get(target, prop) {

        return scales.get(prop.toLowerCase());
    },
    getOwnPropertyNames() {

        return Object.getOwnPropertyNames(keys);
    }
});

module.exports = { Color };
