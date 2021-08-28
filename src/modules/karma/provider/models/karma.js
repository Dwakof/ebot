'use strict';

const { Model } = require('objection');

const { v4 : uuidv4 } = require('uuid');

class Member extends Model {

    static get tableName() {

        return 'karma';
    }

    static get idColumn() {

        return 'id';
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['guildId', 'userId', 'value'],

            properties : {
                id        : { type : 'number' },
                guildId   : { type : 'string' },
                userId    : { type : 'string' },
                value     : { type : 'number' },
                createdAt : { type : 'date' }
            }
        };
    }

    $beforeInsert(queryContext) {

        this.id = uuidv4();
    }
}

module.exports = Member;
