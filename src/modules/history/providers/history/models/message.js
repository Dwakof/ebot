'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

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

    static createValidator() {

        return new AjvValidator({
            options : { allowUnionTypes : true },
            onCreateAjv(ajv) {

                AjvFormat(ajv);
            }
        });
    }
}

module.exports = Message;
