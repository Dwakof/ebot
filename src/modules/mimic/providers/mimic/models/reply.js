'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Reply extends ObjectionProvider.ObjectionModel {

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
                createdAt : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }
}

module.exports = Reply;
