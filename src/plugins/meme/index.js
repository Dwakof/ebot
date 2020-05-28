'use strict';

const Path = require('path');

const Plugin = require('../../core/plugin');

module.exports = class Meme extends Plugin {

    get id() {

        return 'meme';
    }

    beforeLoad(client) {}

    afterLoad(client) {}

    commandHandler() {

        return {
            directory           : Path.join(__dirname, './commands/'),
            commandUtil         : true,
            commandUtilLifetime : 60000,
            allowMention        : true
        };
    }

    inhibitorHandler() {

        return {
            directory : Path.join(__dirname, './inhibitors/')
        };
    }

    listenerHandler() {

        return {
            directory : Path.join(__dirname, './listeners/')
        };
    }
};
