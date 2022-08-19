'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

module.exports = class Store extends Model {

    static get tableName() {

        return 'store';
    }

    static get idColumn() {

        return ['module', 'namespace', 'guildId', 'id'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['module', 'namespace', 'guildId', 'id', 'value'],

            properties : {
                module    : { type : 'string' },
                namespace : { type : 'string' },
                guildId   : { type : 'string' },
                id        : { type : 'string' },
                value     : { type : 'object' },
                createdAt : { type : ['object', 'number', 'string'], format : 'date' },
                updatedAd : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }

    static get jsonAttributes() {

        return ['value'];
    }

    static createValidator() {

        return new AjvValidator({
            options : { allowUnionTypes : true },
            onCreateAjv(ajv) {

                AjvFormat(ajv);
            }
        });
    }

    async $beforeInsert(queryContext) {

        await super.$beforeInsert(queryContext);

        this.updatedAt = new Date().toISOString();
        this.createdAt = this.updatedAt;
    }

    async $beforeUpdate(opt, queryContext) {

        await super.$beforeUpdate(opt, queryContext);

        this.updatedAt = new Date().toISOString();
    }
}
