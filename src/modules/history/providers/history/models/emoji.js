'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Emoji extends ObjectionProvider.ObjectionModel {

    static get tableName() {

        return 'emoji';
    }

    static get idColumn() {

        return ['messageId', 'authorId', 'type', 'emoji', 'index'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['messageId', 'guildId', 'authorId', 'channelId', 'type', 'index', 'emoji', 'name', 'unicode', 'createdAt'],

            properties : {
                messageId : { type : 'string' },
                guildId   : { type : 'string' },
                authorId  : { type : 'string' },
                channelId : { type : 'string' },
                type      : { type : 'string' },
                index     : { type : 'integer' },
                emoji     : { type : 'string' },
                name      : { type : 'string' },
                unicode   : { type : 'boolean' },
                createdAt : { type : ['object', 'number', 'string'], format : 'date' },
                updatedAt : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }

    static get relationMappings() {

        return {
            message : {
                relation   : Emoji.BelongsToOneRelation,
                modelClass : require('./message'),
                join       : {
                    from : 'emoji.messageId',
                    to   : 'message.id'
                }
            }
        };
    }
}

module.exports = Emoji;
