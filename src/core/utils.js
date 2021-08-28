'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

module.exports = {

    REGEX_USER_MENTION    : /^<@![0-9]+>$/gi,
    REGEX_CHANNEL_MENTION : /^<#[0-9]+>$/gi,

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    },

    isString(string) {

        return typeof string === 'string' || string instanceof String;
    },

    async requireDir(path) {

        const requires = [];

        for (const file of await Fs.readdir(path)) {

            requires.push(require(Path.join(path, file)));
        }

        return requires;
    }
};
