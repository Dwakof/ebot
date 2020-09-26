'use strict';

const Path = require('path');

const ObjectionProvider = require('../../core/objectionProvider');

module.exports = (client) => {

    return {
        id       : 'karma',
        provider : new ObjectionProvider({
            ...client.settings.plugins.karma.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, [require('./models/karma')])
    };
};
