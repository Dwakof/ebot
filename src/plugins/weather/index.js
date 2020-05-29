'use strict';

const Path = require('path');

const Plugin = require('../../core/plugin');

module.exports = class Weather extends Plugin {

    get id() {

        return 'weather';
    }

    beforeLoad(client) {}

    afterLoad(client) {}

    commandHandler() {

        return {
            directory           : Path.join(__dirname, './commands/'),
            commandUtil         : true,
            commandUtilLifetime : 60000,
            allowMention        : true,
            prefix              : '?',
            argumentDefaults    : {
                prompt : {
                    timeout : 'Time ran out, command has been cancelled.',
                    ended   : 'Too many retries, command has been cancelled.',
                    cancel  : 'Command has been cancelled.',
                    retries : 4,
                    time    : 30000
                }
            }
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
