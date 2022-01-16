'use strict';

const { GuildMember, Guild, Role, User, Channel, Message } = require('discord.js');

const { isString }    = require('./is');
const { flattenKeys } = require('./tool');

module.exports = {

    serializeArg(arg) {

        if (Array.isArray(arg)) {

            return { type : 'array', ...flattenKeys({ values : module.exports.serializeArgs(arg) }) };
        }

        if (arg instanceof Set) {

            return { type : 'set', values : module.exports.serializeArgs(Object.fromEntries(Array.from(arg))) };
        }

        if (arg instanceof Map) {

            return { type : 'map', values : module.exports.serializeArgs(Object.fromEntries(arg)) };
        }

        if (arg instanceof GuildMember) {

            return {
                type     : 'member',
                id       : arg.id,
                username : `${ arg.username || arg.user.username }#${ arg.discriminator || arg.user.discriminator }`
            };
        }

        if (arg instanceof Guild) {

            return { type : 'guild', id : arg.id, name : arg.name };
        }

        if (arg instanceof Role) {

            return { type : 'role', id : arg.id, name : arg.name };
        }

        if (arg instanceof User) {

            return { type : 'user', id : arg.id, username : `${ arg.username }#${ arg.discriminator }` };
        }

        if (arg instanceof Channel) {

            return { type : 'channel', id : arg.id, name : arg.name };
        }

        if (arg instanceof Message) {

            return { type : 'message', id : arg.id };
        }

        if (arg instanceof Error) {

            return { type : 'error', msg : arg.message || arg.toString(), err : arg };
        }

        if (isString(arg)) {

            return { type : 'string', value : arg };
        }

        return { type : 'other', value : arg };
    },

    serializeArgs(args) {

        const result = {};

        for (const [key, value] of Object.entries(args)) {

            result[key] = module.exports.serializeArg(value);
        }

        return result;
    }
};
