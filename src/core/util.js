'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { GuildMember, User, Guild, Channel, Message, Role } = require('discord.js');

// eslint-disable-next-line no-unused-vars
const { Snowflake, ReactionEmoji, GuildEmoji } = require('discord.js');

const { EventEmitter } = require('events');

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

class Task extends EventEmitter {

    #values = new Map();
    #executor;

    constructor(executor) {

        super();

        this.set({
            doing   : false,
            done    : false,
            failed  : false,
            startAt : null,
            endAt   : null
        });

        this.#executor = executor;
    }

    increase(key, value = 1) {

        return this.set({ [key] : (this.#values.get(key) || 0) + value });
    }

    set(values = {}) {

        const previous = {};

        for (const [key, value] of Object.entries(values)) {

            previous[key] = this.get(key);
            this.#values.set(key, value);
        }

        this.emit('update', this, values, previous);

        return this;
    }

    start() {

        this.set({ doing : true, startAt : new Date() });

        this.emit('start', this);

        return this;
    }

    done() {

        this.set({ doing : false, done : true, endAt : new Date() });

        this.emit('done', this);
        this.emit('resolve', this);

        return this;
    }

    enforceStop() {

        this.set({ doing : false, endAt : this.get('endAt') ?? new Date() });
        this.emit('resolve', this);

        return this;
    }

    failed(error) {

        this.set({ doing : false, done : false, failed : true, endAt : new Date(), error });

        this.emit('failed', this);
        this.emit('reject', this);

        return this;
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

    then(fulfil, reject) {

        this.start();

        this.once('failed', () => {

            reject(this.get('error'));
        });

        this.#executor(this)
            .then(() => fulfil(this.getAll()))
            .catch((error) => {

                this.failed(error);
            });
    }
}

module.exports = class CoreUtil {

    static REGEX_URL            = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    static REGEX_CODE_BLOCK     = /(?<=[^`]|^)(`(?:``)?)([^`]+)(?=[^`]|$)/ig;

    static isString(string) {

        return typeof string === 'string' || string instanceof String;
    }

    static isPromise(value) {

        return value
            && typeof value.then === 'function'
            && typeof value.catch === 'function';
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

        if (arg instanceof Error) {

            return { type : 'error', msg : arg.message || arg.toString(), err : arg };
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

    static Task = Task;

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

    /**
     * @param {String|Snowflake} guildId
     * @param {String|Snowflake} channelId
     * @param {String|Snowflake} messageId
     * @param {Message}          message
     *
     * @return {String}
     */
    static linkUrl({ guildId = '@me', channelId, messageId, message }) {

        const base = `https://discordapp.com/channels`;

        if (message) {

            return [base, message.guildId || '@me', message.channelId, message.id].filter(Boolean).join('/');
        }

        return [base, guildId, channelId, messageId].filter(Boolean).join('/');
    }

    /**
     * @param {Emoji|GuildEmoji|ReactionEmoji} emoji
     * @param {Object}                         [options]
     *
     * @return {string}
     */
    static emojiURL(emoji, options = {}) {

        if (emoji.url) {

            return emoji.url;
        }

        const { cdn = 'https://twemoji.maxcdn.com', v = 'latest', sep = '-', size = '72x72', ext = 'png' } = options;

        const surrogates = emoji.name.indexOf(String.fromCharCode(0x200D)) < 0 ? emoji.name.replace(/\uFE0F/g, '') : emoji.name;

        const r = [];

        let c = 0;
        let p = 0;
        let i = 0;

        while (i < surrogates.length) {

            c = surrogates.charCodeAt(i++);

            if (p) {
                r.push((0x10000 + ((p - 0xD800) << 10) + (c - 0xDC00)).toString(16));
                p = 0;
            }
            else if (c >= 0xD800 && c <= 0xDBFF) {
                p = c;
            }
            else {
                r.push(c.toString(16));
            }
        }

        const code = r.join(sep);

        return [cdn, 'v', v, size, `${ code }.${ ext }`].join('/');
    }
};
