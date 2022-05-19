'use strict';

const { Model : _Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

class Model extends _Model {

    static get tableName() {

        return 'model';
    }

    static get idColumn() {

        return ['guildId', 'userId'];
    }

    static get jsonAttributes() {

        return ['model'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['guildId', 'userId', 'model'],

            properties : {
                guildId   : { type : 'string' },
                userId    : { type : 'string' },
                model     : { type : 'object' },
                createdAt : { type : ['object', 'number', 'string'], format : 'date' },
                updatedAt : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }

    $beforeInsert(queryContext) {

        this.createdAt = new Date();
        this.updatedAt = this.createdAt;
    }

    $beforeUpdate(opt, queryContext) {

        this.updatedAt = new Date();
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

module.exports = Model;
