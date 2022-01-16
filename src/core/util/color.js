'use strict';

const Color = require('chroma-js');

Color.brewer.github  = [Color('#2F3136').darken(0.2), '#0e4429', '#006d32', '#26a641', '#39d353'];
Color.brewer.discord = [Color('#2F3136').darken(0.2), '#404EED'];

module.exports = { Color };
