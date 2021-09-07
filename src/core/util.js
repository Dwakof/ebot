'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { GuildMember, User, Guild, Channel, Message, Role } = require('discord.js');
const { EventEmitter }                                     = require('events');

class KnexAsyncIterator {

    constructor(query) {

        this.stream = query.stream();
        this.buffer = [];

        this.stream.on('data', this.onData);
        this.stream.on('error', this.onError);
        this.stream.on('end', this.onEnd);
    }

    done = false;

    onData = (data) => {

        this.pause();
        this.push({ done : false, value : data });
    };

    push = (payload) => {

        if (this.resolve) {
            this.resolve(payload);
            this.resolve = null;
            this.reject  = null;
        }
        else {
            this.buffer.push(payload);
        }
    };

    onError = (error) => {

        this.finalCleanup();

        if (this.reject) {

            this.reject(error);
            this.reject  = null;
            this.resolve = null;
        }
        else {
            throw error;
        }
    };

    onEnd = () => {

        this.finalCleanup();
        this.push({
            done : true
        });
    };

    pause = () => {

        this.stream.pause();
    };

    finalCleanup = () => {

        this.stream.off('data', this.onData);
        this.stream.off('error', this.onError);
        this.stream.off('end', this.onEnd);
        this.done = true;
    };

    next() {

        if (this.buffer.length) {
            return this.buffer.shift();
        }

        if (this.done) {
            return { done : true };
        }

        return new Promise((resolve, reject) => {

            this.resolve = resolve;
            this.reject  = reject;
            this.stream.resume();
        });
    }
}

class Status extends EventEmitter {

    #values = new Map();

    constructor(values) {

        super();

        if (values) {

            this.set(values);
        }
    }

    increase(key, value = 1) {

        this.set({ [key] : (this.#values.get(key) || 0) + value });
    }

    set(values = {}) {

        for (const [key, value] of Object.entries(values)) {

            this.#values.set(key, value);
        }
    }

    update() {

        this.emit('update', this.getAll());
    }

    get(key) {

        return this.#values.get(key);
    }

    getAll() {

        return Object.fromEntries(this.#values);
    }

    toJSON() {

        return this.getAll();
    }
}

module.exports = class CoreUtil {

    static REGEX_URL        = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    static REGEX_CODE_BLOCK = /(?<=[^`]|^)(`(?:``)?)([^`]+)(?=[^`]|$)/ig;

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

    static KnexAsyncIterator = KnexAsyncIterator;

    static Status = Status;

    static memoize(fn) {

        const cache = {};

        return (...args) => {

            const n = args[0];

            if (n in cache) {

                return cache[n];
            }

            cache[n] = fn(n);

            return cache[n];
        };
    }

    /**
     * Returns a random integer between the specified values. The value is no lower than min
     * (or the next integer greater than min if min isn't an integer), and is less than (but
     * not equal to) max.
     */
    static randomNumber(min = 0, max = 1) {

        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {

        return Math.round(CoreUtil.randomNumber(min, max));
    }

    static randomValue(array = []) {

        return array[CoreUtil.randomInt(0, array.length - 1)] || undefined;
    }
};
