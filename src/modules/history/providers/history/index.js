'use strict';

const Path = require('path');

const ObjectionProvider = require('../../../../core/providers/objection');
const CoreUtil          = require('../../../../core/util');

module.exports = async (client) => {

    return {
        id       : 'history',
        provider : new ObjectionProvider({
            ...client.settings.plugins.history.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await CoreUtil.requireDir(Path.join(__dirname, './models')))
    };
};
