'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

class Emoji extends Model {

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
                createdAt : { type : 'object', format : 'date' },
                updatedAt : { type : 'object', format : 'date' }
            }
        };
    }

    static get relationMappings() {

        return {
            message : {
                relation   : Model.BelongsToOneRelation,
                modelClass : require('./message'),
                join       : {
                    from : 'emoji.messageId',
                    to   : 'message.id'
                }
            }
        };
    }

    static createValidator() {

        return new AjvValidator({
            onCreateAjv(ajv) {

                AjvFormat(ajv);
            }
        });
    }
}

module.exports = Emoji;
