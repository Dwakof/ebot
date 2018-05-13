'use strict';

const Commando = require('discord.js-commando');

module.exports = (client, settings) => {

    return [
        {
            event :   'error',
            handler : (error) => {

                client.log.error({ event : 'error' }, error);
                client.raven.captureException(error);
            }
        },
        {
            event :   'warning',
            handler : (message) => {

                client.log.warn({ event : 'debug' }, message);
            }
        },
        {
            event :   'debug',
            handler : (message) => {

                client.log.debug({ event : 'debug' }, message);
            }
        },
        {
            event :   'message',
            handler : (message) => {

                client.log.debug({
                    event :  'message',
                    id :     message.id,
                    author : {
                        username :      message.author.username,
                        id :            message.author.id,
                        discriminator : message.author.discriminator
                    },
                    guild :  {
                        id :   message.channel.guild.id,
                        name : message.channel.guild.name
                    },
                    channel :  {
                        id :   message.channel.id,
                        name : message.channel.name
                    }
                }, `[${message.channel.guild.name}] [${message.channel.name}] [${message.author.username}#${message.author.discriminator}] ${message.content}`);
            }
        },
        {
            event :   'disconnect',
            handler : () => {

                client.log.warn({ event : 'disconnect' }, 'disconnected');
            }
        },
        {
            event :   'reconnecting',
            handler : () => {

                client.log.warn({ event : 'reconnecting' }, 'reconnecting');
            }
        },
        {
            event :   'commandError',
            handler : (command, error) => {

                client.log.error({
                    event : 'commandError',
                    data :  {
                        command,
                        error
                    }
                }, error.msg);

                if (error instanceof Commando.FriendlyError) {
                    return;
                }

                client.raven.captureException(error);
            }
        },
        {
            event :   'commandBlocked',
            handler : (message, reason) => {

                client.log.info({
                    event : 'commandBlocked',
                    data :  {
                        message,
                        reason
                    }
                }, `Command ${message.command ? `${message.command.groupID}:${message.command.memberName}` : ''} blocked; ${reason}`);
            }
        },
        {
            event :   'commandPrefixChange',
            handler : (guild, prefix) => {

                client.log.info({
                    event : 'commandPrefixChange',
                    data :  {
                        guild,
                        prefix
                    }
                }, `Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
            }
        },
        {
            event :   'commandStatusChange',
            handler : (guild, command, enabled) => {

                client.log.info({
                    event : 'commandStatusChange',
                    data :  {
                        guild,
                        command,
                        enabled
                    }
                }, `Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
            }
        },
        {
            event :   'groupStatusChange',
            handler : (guild, group, enabled) => {

                client.log.info({
                    event : 'groupStatusChange',
                    data :  {
                        guild,
                        group,
                        enabled
                    }
                }, `Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
            }
        }
    ];
};
