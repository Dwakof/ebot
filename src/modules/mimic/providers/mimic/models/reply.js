'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

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
                createdAt : { type : 'object', format : 'date' }
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

module.exports = Reply;
