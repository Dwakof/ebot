'use strict';

const Path = require('path');

const Plugin = require('../../core/plugin');

module.exports = class Utils extends Plugin {

    get id() {

        return 'utils';
    }

    beforeLoad(client) {}

    afterLoad(client) {}

    commandHandlerOptions() {

        return {
            directory           : Path.join(__dirname, './commands/'),
            commandUtil         : true,
            commandUtilLifetime : 60000,
            allowMention        : true
        };
    }

    inhibitorHandlerOptions() {

        return {
            directory : Path.join(__dirname, './inhibitors/')
        };
    }

    listenerHandlerOptions() {

        return {
            directory : Path.join(__dirname, './listeners/')
        };
    }
};
