'use strict';

const Path = require('path');

const ObjectionProvider = require('../../../core/providers/objection');

module.exports = async (client) => {

    return {
        id       : 'mimic',
        provider : new ObjectionProvider({
            ...client.settings.plugins.mimic.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await client.utils.requireDir(Path.join(__dirname, './models')))
    };
};
