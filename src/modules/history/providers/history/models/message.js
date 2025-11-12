'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Message extends ObjectionProvider.ObjectionModel {

    static get tableName() {

        return 'message';
    }

    static get idColumn() {

        return 'id';
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['id', 'guildId', 'authorId', 'channelId', 'content', 'createdAt'],

            properties : {
                id        : { type : 'string' },
                guildId   : { type : 'string' },
                authorId  : { type : 'string' },
                channelId : { type : 'string' },
                content   : { type : 'string' },
                createdAt : { type : ['object', 'number', 'string'], format : 'date' },
                updatedAt : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }
}

module.exports = Message;
