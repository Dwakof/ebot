const Envy     = require('envy');
const Raven    = require('raven');
const Commando = require('discord.js-commando');
const Sqlite   = require('sqlite');
const Path     = require('path');
const Pino     = require('pino')();

const settings = Envy(process.env.DOTENV_PATH || './.env');

Raven.config(settings.sentryEndpoint).install();

exports.start = async (settings) => {

    const client = new Commando.Client({ owner : settings.discordOwnerId });

    client.on('error', (error) => {
        Pino.error({ event : 'error' }, error);
        Raven.captureException(error);
    });

    client.on('warning', (message) => {
        Pino.warn({ event : 'warning' }, message);
    });

    client.on('debug', (message) => {
        Pino.debug({ event : 'debug' }, message);
    });

    client.on('ready', () => {
        // NOTIFY IN #BLACKMESA
        Pino.info({ event : 'ready' }, 'ready');
    });

    client.on('disconnect', () => {
        Pino.warn({ event : 'disconnect' }, 'disconnected');
    });

    client.on('reconnecting', () => {
        Pino.warn({ event : 'reconnecting' }, 'reconnecting');
    });

    client.on('commandError', (command, error) => {
        Pino.error({ event : 'commandError', data : { command, error } }, error.msg);

        if (error instanceof Commando.FriendlyError) {
            return;
        }

        Raven.captureException(error);
    });

    client.on('commandBlocked', (msg, reason) => {
        Pino.info({
            event : 'commandBlocked',
            data :  { msg, reason }
        }, `Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''} blocked; ${reason}`);
    });

    client.on('commandPrefixChange', (guild, prefix) => {
        Pino.info({
            event : 'commandPrefixChange',
            data :  { guild, prefix }
        }, `Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    client.on('commandStatusChange', (guild, command, enabled) => {
        Pino.info({
            event : 'commandStatusChange',
            data :  { guild, command, enabled }
        }, `Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    client.on('groupStatusChange', (guild, group, enabled) => {
        Pino.info({
            event : 'commandStatusChange',
            data :  { guild, group, enabled }
        }, `Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}`);
    });

    const db = await Sqlite.open(Path.resolve(__dirname, settings.sqlitePath || './database.sqlite3'));

    const providerInitPromise = client.setProvider(new Commando.SQLiteProvider(db));

    client.registry.registerDefaults();

    await client.login(settings.discordToken);

    await providerInitPromise;

    return client;
};

if (!module.parent) {

    process.on('unhandledRejection', (error) => {
        Pino.error({ event : 'unhandledRejection' }, error);
        Raven.captureException(error);
        throw error;
    });

    exports.start(settings).catch((error) => {
        Pino.fatal(error);
        throw error;
    });
}

