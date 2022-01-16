'use strict';

const EmojiRegex = require('emoji-regex');

module.exports   = {
    REGEX_URL           : /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig,
    REGEX_CODE_BLOCK    : /(?<=[^`]|^)(`(?:``)?)([^`]+)(?=[^`]|$)/ig,
    REGEX_EMOJI         : /<(?<animated>a?):(?<name>.|[^>]+):(?<id>\d+)>/gmi,
    REGEX_UNICODE_EMOJI : EmojiRegex()
};
