'use strict';

const { Model : _Model } = require('objection');

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
                createdAt : { type : 'date' },
                updatedAt : { type : 'date' }
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
