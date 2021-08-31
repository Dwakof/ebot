'use strict';

const { Model } = require('objection');

class Reply extends Model {

    static get tableName() {

        return 'reply';
    }

    static get idColumn() {

        return 'messageId';
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['messageId', 'guildId', 'userId', 'content'],

            properties : {
                messageId : { type : 'string' },
                guildId   : { type : 'string' },
                userId    : { type : 'string' },
                content   : { type : 'string' },
                createdAt : { type : 'date' }
            }
        };
    }
}

module.exports = Reply;
