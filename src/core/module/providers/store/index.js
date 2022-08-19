'use strict';

const Path = require('path');

const { ObjectionProvider, Util } = require('../../../../core');

module.exports = async (client, settings) => {

    return {
        id       : 'store',
        provider : new ObjectionProvider({
            ...settings.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await Util.requireDir(Path.join(__dirname, './models')))
    };
};
