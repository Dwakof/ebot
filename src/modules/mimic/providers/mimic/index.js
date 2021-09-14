'use strict';

const Path = require('path');

const { ObjectionProvider, Util } = require('../../../../core');

module.exports = async (client) => {

    return {
        id       : 'mimic',
        provider : new ObjectionProvider({
            ...client.settings.plugins.mimic.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await Util.requireDir(Path.join(__dirname, './models')))
    };
};
