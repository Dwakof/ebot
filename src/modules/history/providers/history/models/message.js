'use strict';

const { Model } = require('objection');

class Message extends Model {

    static get tableName() {

        return 'message';
    }

    static get idColumn() {

        return 'id';
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['id', 'guildId', 'authorId', 'content', 'createdAt'],

            properties : {
                id        : { type : 'string' },
                guildId   : { type : 'string' },
                authorId  : { type : 'string' },
                content   : { type : 'string' },
                createdAt : { type : 'date' },
                updatedAt : { type : 'date' }
            }
        };
    }
}

module.exports = Message;
