'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { GuildMember, User, Guild, Channel, Message, Role } = require('discord.js');

module.exports = class CoreUtil {

    static isString(string) {

        return typeof string === 'string' || string instanceof String;
    }

    static async requireDir(rootPath, info = false) {

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
    }

    static isValidObject(value) {

        if (!value) {
            return false;
        }

        const isArray  = Array.isArray(value);
        const isBuffer = Buffer.isBuffer(value);
        const isObject = Object.prototype.toString.call(value) === '[object Object]';
        const hasKeys  = !!Object.keys(value).length;

        return !isArray && !isBuffer && isObject && hasKeys;
    }

    static flattenKeys(obj, separator = '.') {

        const walker = (child, path = []) => {

            return Object.assign({}, ...Object.keys(child).map((key) => {

                if (key.startsWith('$')) {

                    return { [path.concat([key.slice(1)]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
                }

                if (CoreUtil.isValidObject(child[key])) {

                    return walker(child[key], path.concat([key]));
                }

                return { [path.concat([key]).join(separator).replace(/[A-Z]/g, (letter) => `_${ letter.toLowerCase() }`)] : child[key] };
            }));
        };

        return Object.assign({}, walker(obj));
    }

    static serializeArg(arg) {

        if (Array.isArray(arg)) {

            return { type : 'array', ...CoreUtil.flattenKeys({ values : CoreUtil.serializeArgs(arg) }) };
        }

        if (arg instanceof Set) {

            return { type : 'set', values : CoreUtil.serializeArgs(Object.fromEntries(Array.from(arg))) };
        }

        if (arg instanceof Map) {

            return { type : 'map', values : CoreUtil.serializeArgs(Object.fromEntries(arg)) };
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

        if (CoreUtil.isString(arg)) {

            return { type : 'string', value : arg };
        }

        return { type : 'other', value : arg };
    }

    static serializeArgs(args) {

        const result = {};

        for (const [key, value] of Object.entries(args)) {

            result[key] = CoreUtil.serializeArg(value);
        }

        return result;
    }
};
