'use strict';

const Path = require('path');

const { ObjectionProvider, Util } = require('../../../../core');

module.exports = async (client) => {

    return {
        id       : 'history',
        provider : new ObjectionProvider({
            ...client.settings.plugins.history.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await Util.requireDir(Path.join(__dirname, './models')))
    };
};
