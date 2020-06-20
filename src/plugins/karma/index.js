'use strict';

const Path = require('path');

const Plugin            = require('../../core/plugin');
const ObjectionProvider = require('../../core/objectionProvider');

module.exports = class Karma extends Plugin {

    get id() {

        return 'karma';
    }

    beforeLoad(client) {}

    afterLoad(client) {}

    commandHandlerOptions() {

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

    providers(client) {

        return {
            id       : 'karma',
            provider : new ObjectionProvider({
                ...client.settings.plugins.karma.knex,
                migrations : {
                    directory : Path.join(__dirname, '/migrations')
                }
            }, [require('./models/karma')])
        };
    }
};
