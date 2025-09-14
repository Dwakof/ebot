'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Model extends ObjectionProvider.ObjectionModel {

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
}

module.exports = Model;
