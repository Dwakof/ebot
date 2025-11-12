'use strict';

const { ObjectionProvider } = require('../../../../../core');

class Member extends ObjectionProvider.ObjectionModel {

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
                createdAt : { type : ['object', 'number', 'string'], format : 'date' }
            }
        };
    }
}

module.exports = Member;
