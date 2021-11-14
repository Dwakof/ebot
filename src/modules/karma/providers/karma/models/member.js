'use strict';

const { Model, AjvValidator } = require('objection');

const AjvFormat = require('ajv-formats');

class Member extends Model {

    static get tableName() {

        return 'karma';
    }

    static get idColumn() {

        return ['guildId', 'userId', 'messageId', 'giverId', 'type', 'value'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['guildId', 'userId', 'messageId', 'giverId', 'type', 'value'],

            properties : {
                guildId   : { type : 'string' },
                userId    : { type : 'string' },
                messageId : { type : 'string' },
                giverId   : { type : 'string' },
                type      : { type : 'string' },
                value     : { type : 'number' },
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

module.exports = Member;
