'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { GuildMember, User, Guild, Channel, Message, Role } = require('discord.js');

const internals = {

    REGEX_USER_MENTION    : /^<@![0-9]+>$/gi,
    REGEX_CHANNEL_MENTION : /^<#[0-9]+>$/gi,

    capitalize(string) {

        return string[0].toUpperCase() + string.slice(1);
    },

    isString(string) {

        return typeof string === 'string' || string instanceof String;
    },

    async requireDir(rootPath, info = false) {

        const requires = [];

        for (const file of await Fs.readdir(rootPath)) {

            const path = Path.join(rootPath, file);

            if (info) {

                requires.push({ file : require(path), name : file, path });
            }
            else {

                requires.push(require(path));
            }
        }

        return requires;
    },

    flattenKeys(obj, separator = '.') {

        const isValidObject = (value) => {

            if (!value) {
                return false;
            }

            const isArray  = Array.isArray(value);
            const isBuffer = Buffer.isBuffer(value);
            const isObject = Object.prototype.toString.call(value) === '[object Object]';
            const hasKeys  = !!Object.keys(value).length;

            return !isArray && !isBuffer && isObject && hasKeys;
        };

        const walker = (child, path = []) => {

            return Object.assign({}, ...Object.keys(child).map((key) => {

                if (key.startsWith('$')) {

                    return { [path.concat([key.slice(1)]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
                }

                if (isValidObject(child[key])) {

                    return walker(child[key], path.concat([key]));
                }

                return { [path.concat([key]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
            }));
        };

        return Object.assign({}, walker(obj));
    },

    serializeArg(arg) {

        if (Array.isArray(arg)) {

            return { type : 'array', ...internals.flattenKeys({ values : internals.serializeArgs(arg) }) };
        }

        if (arg instanceof Set) {

            return { type : 'set', values : internals.serializeArgs(Object.fromEntries(Array.from(arg))) };
        }

        if (arg instanceof Map) {

            return { type : 'map', values : internals.serializeArgs(Object.fromEntries(arg)) };
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

        if (internals.isString(arg)) {

            return { type : 'string', value : arg };
        }

        return { type : 'other', value : arg };
    },

    serializeArgs(args) {

        const result = {};

        for (const [key, value] of Object.entries(args)) {

            result[key] = internals.serializeArg(value);
        }

        return result;
    }
};

module.exports = internals;
