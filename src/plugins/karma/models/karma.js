'use strict';

const { Model } = require('objection');

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
}

module.exports = Member;
