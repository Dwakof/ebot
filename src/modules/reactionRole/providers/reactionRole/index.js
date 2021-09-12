'use strict';

const Path = require('path');

const { ObjectionProvider, Util } = require('../../../../core');

module.exports = async (client) => {

    return {
        id       : 'reactionRole',
        provider : new ObjectionProvider({
            ...client.settings.plugins.reactionRole.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await Util.requireDir(Path.join(__dirname, './models')))
    };
};
