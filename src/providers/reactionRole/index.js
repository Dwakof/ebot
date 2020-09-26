'use strict';

const Path = require('path');

const ObjectionProvider = require('../../core/objectionProvider');

module.exports = (client) => {

    return {
        id       : 'reactionRole',
        provider : new ObjectionProvider({
            ...client.settings.plugins.reactionRole.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, [require('./models/reactionRole')])
    };
};
