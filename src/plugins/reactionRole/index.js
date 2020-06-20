'use strict';

const Path = require('path');

const Plugin            = require('../../core/plugin');
const ObjectionProvider = require('../../core/objectionProvider');

module.exports = class reactionRole extends Plugin {

    get id() {

        return 'reactionRole';
    }

    beforeLoad(client) {}

    afterLoad(client) {}

    commandHandler() {

        return {
            directory           : Path.join(__dirname, './commands/'),
            allowMention        : true,
            commandUtil         : true,
            commandUtilLifetime : 60000,
            storeMessages       : true,
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

    providers(client) {

        return {
            id       : 'reactionRole',
            provider : new ObjectionProvider({
                ...client.settings.plugins.reactionRoles.knex,
                migrations : {
                    directory : Path.join(__dirname, '/migrations')
                }
            }, [require('./models/reactionRole')])
        };
    }
};
