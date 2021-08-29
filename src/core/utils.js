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

    async requireDir(rootPath, info = false) {

        const requires = [];

        for (const file of await Fs.readdir(rootPath)) {

            const path = Path.join(rootPath, file);

            if (info) {

                requires.push({ file : require(path), name : file, path });
            }
            else {

                requires.push(require(path));
            }
        }

        return requires;
    }
};
