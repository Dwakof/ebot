'use strict';

const Envy     = require('envy');
const Raven    = require('raven');
const Commando = require('discord.js-commando');
const Sqlite   = require('sqlite');
const Path     = require('path');
const Pino     = require('pino');

const settings = Envy(process.env.DOTENV_PATH || './.env');

const pino = Pino({
    name :  'ebot',
    level : settings.logLevel || 'debug'
});

Raven.config(settings.sentryEndpoint)
    .install();

exports.start = async (options) => {

    const client = new Commando.Client({ owner : options.discordOwnerId });

    client.log   = pino;
    client.raven = Raven;

    client.on('error', (error) => {

        pino.error({ event : 'error' }, error);
        Raven.captureException(error);
    });

    client.on('warning', (message) => {

        pino.warn({ event : 'warning' }, message);
    });

    client.on('debug', (message) => {

        pino.debug({ event : 'debug' }, message);
    });

    client.on('ready', () => {
        // NOTIFY IN #BLACKMESA
        pino.info({ event : 'ready' }, 'ready');
    });

    client.on('disconnect', () => {

        pino.warn({ event : 'disconnect' }, 'disconnected');
    });

    client.on('reconnecting', () => {

        pino.warn({ event : 'reconnecting' }, 'reconnecting');
    });

    client.on('commandError', (command, error) => {

        pino.error({
            event : 'commandError',
            data :  {
                command,
                error
            }
        }, error.msg);

        if (error instanceof Commando.FriendlyError) {
            return;
        }

        Raven.captureException(error);
    });

    client.on('commandBlocked', (msg, reason) => {

        pino.info({
            event : 'commandBlocked',
            data :  {
                msg,
                reason
            }
        }, `Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''} blocked; ${reason}`);
    });

    client.on('commandPrefixChange', (guild, prefix) => {

        pino.info({
            event : 'commandPrefixChange',
            data :  {
                guild,
                prefix
            }
        }, `Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    client.on('commandStatusChange', (guild, command, enabled) => {

        pino.info({
            event : 'commandStatusChange',
            data :  {
                guild,
                command,
                enabled
            }
        }, `Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    client.on('groupStatusChange', (guild, group, enabled) => {

        pino.info({
            event : 'commandStatusChange',
            data :  {
                guild,
                group,
                enabled
            }
        }, `Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    const db = await Sqlite.open(Path.resolve(__dirname, options.sqlitePath || './database.sqlite3'));

    const providerInitPromise = client.setProvider(new Commando.SQLiteProvider(db));

    client.registry.registerDefaults();

    await client.login(options.discordToken);

    await providerInitPromise;

    return client;
};

if (!module.parent) {

    process.on('unhandledRejection', (error) => {

        pino.error({ event : 'unhandledRejection' }, error);
        Raven.captureException(error);
        throw error;
    });

    exports.start(settings).catch((error) => {

        pino.fatal(error);
        throw error;
    });
}
