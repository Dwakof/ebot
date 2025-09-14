'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Search extends ObjectionProvider.ObjectionModel {

    static get tableName() {

        return 'search';
    }

    static get idColumn() {

        return ['guildId', 'userId', 'search'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['guildId', 'userId', 'search'],

            properties : {
                guildId : { type : 'string' },
                userId  : { type : 'string' },
                search  : { type : 'string' },
                used    : { type : 'number' }
            }
        };
    }
}

module.exports = Search;
