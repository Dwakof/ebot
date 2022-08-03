'use strict';

const { ChannelType } = require('discord.js');

module.exports = {

    isString(string) {

        return typeof string === 'string' || string instanceof String;
    },

    isPromise(value) {

        return value
            && typeof value.then === 'function'
            && typeof value.catch === 'function';
    },

    isFunction(value) {

        return typeof value === 'function' || value instanceof Function;
    },

    isValidObject(value) {

        if (!value) {

            return false;
        }

        const isArray  = Array.isArray(value);
        const isBuffer = Buffer.isBuffer(value);
        const isObject = Object.prototype.toString.call(value) === '[object Object]';
        const hasKeys  = !!Object.keys(value).length;

        return !isArray && !isBuffer && isObject && hasKeys;
    },

    isTextChannel(channel) {

        return channel.type === ChannelType.GuildText;
    },

    isVoiceChannel(channel) {

        return channel.type === ChannelType.GuildVoice;
    }
};
