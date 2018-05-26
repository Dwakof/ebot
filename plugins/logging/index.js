'use strict';

const Commando = require('discord.js-commando');
const Hoek     = require('hoek');
const Events   = require('../../lib/events');

module.exports = {
    name     : 'logging',
    register : (client, settings) => {

        Events.registerEvents(client, [
            {
                event   : 'error',
                handler : (error) => {

                    client.log.error({ event : 'error' }, error);
                    client.raven.captureException(error);
                }
            },
            {
                event   : 'warning',
                handler : (message) => {

                    client.log.warn({ event : 'debug' }, message);
                }
            },
            {
                event   : 'debug',
                handler : (message) => {

                    client.log.debug({ event : 'debug' }, message);
                }
            },
            {
                event   : 'message',
                handler : (message) => {

                    const data = Hoek.transform(message, {
                        'id'                   : 'id',
                        'author.id'            : 'author.id',
                        'author.username'      : 'author.username',
                        'author.discriminator' : 'author.discriminator',
                        'guild.id'             : 'guild.id',
                        'guild.name'           : 'guild.name',
                        'channel.id'           : 'channel.id',
                        'channel.name'         : 'channel.name',
                        'channel.type'         : 'channel.type'
                    });

                    client.log.debug({
                        event : 'message',
                        ...data
                    }, `[${data.guild.name || 'DM'}] [${message.channel.name}] [${message.author.username}#${message.author.discriminator}] ${message.content}`);
                }
            },
            {
                event   : 'disconnect',
                handler : () => {

                    client.log.warn({ event : 'disconnect' }, 'disconnected');
                }
            },
            {
                event   : 'reconnecting',
                handler : () => {

                    client.log.warn({ event : 'reconnecting' }, 'reconnecting');
                }
            },
            {
                event   : 'commandError',
                handler : (command, error) => {

                    client.log.error({
                        event : 'commandError',
                        data  : {
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
                event   : 'commandBlocked',
                handler : (message, reason) => {

                    client.log.info({
                        event : 'commandBlocked',
                        data  : {
                            message,
                            reason
                        }
                    }, `Command ${message.command ? `${message.command.groupID}:${message.command.memberName}` : ''} blocked; ${reason}`);
                }
            },
            {
                event   : 'commandPrefixChange',
                handler : (guild, prefix) => {

                    client.log.info({
                        event : 'commandPrefixChange',
                        data  : {
                            guild,
                            prefix
                        }
                    }, `Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
                }
            },
            {
                event   : 'commandStatusChange',
                handler : (guild, command, enabled) => {

                    client.log.info({
                        event : 'commandStatusChange',
                        data  : {
                            guild,
                            command,
                            enabled
                        }
                    }, `Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
                }
            },
            {
                event   : 'groupStatusChange',
                handler : (guild, group, enabled) => {

                    client.log.info({
                        event : 'groupStatusChange',
                        data  : {
                            guild,
                            group,
                            enabled
                        }
                    }, `Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
                }
            }
        ]);
    }
};
