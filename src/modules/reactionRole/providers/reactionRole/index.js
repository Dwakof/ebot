'use strict';

const Path = require('path');

const ObjectionProvider = require('../../../../core/providers/objection');
const CoreUtil          = require('../../../../core/util');

module.exports = async (client) => {

    return {
        id       : 'reactionRole',
        provider : new ObjectionProvider({
            ...client.settings.plugins.reactionRole.knex,
            migrations : {
                directory : Path.join(__dirname, '/migrations')
            }
        }, await CoreUtil.requireDir(Path.join(__dirname, './models')))
    };
};
