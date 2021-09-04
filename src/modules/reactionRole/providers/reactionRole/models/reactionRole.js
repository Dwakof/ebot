'use strict';

const { Model } = require('objection');

class ReactionRole extends Model {

    static get tableName() {

        return 'reactionRole';
    }

    static get idColumn() {

        return ['guildId', 'roleId', 'channelId'];
    }

    static get jsonSchema() {

        return {
            type     : 'object',
            required : ['guildId', 'roleId', 'channelId'],

            properties : {
                guildId          : { type : 'string' },
                roleId           : { type : 'string' },
                channelId        : { type : 'string' },
                channelListenIds : {
                    oneOf : [
                        { type : 'null' },
                        {
                            type     : 'array',
                            minItems : 1,
                            items    : {
                                type : 'string'
                            }
                        }
                    ]
                }
            }
        };
    }
}

module.exports = ReactionRole;
