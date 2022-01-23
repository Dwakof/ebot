'use strict';

const { View } = require('../../../core');

module.exports = class CommonView extends View {

    displayEmoji(emoji) {

        return emoji.indexOf(':') !== -1 ? `<${ emoji }>` : emoji;
    }
};
