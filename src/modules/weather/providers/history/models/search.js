'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

class Search extends Model {

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

    static createValidator() {

        return new AjvValidator({
            options : { allowUnionTypes : true },
            onCreateAjv(ajv) {

                AjvFormat(ajv);
            }
        });
    }
}

module.exports = Search;
