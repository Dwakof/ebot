const Envy     = require('envy');
const Raven    = require('raven');
const Commando = require('discord.js-commando');
const Sqlite   = require('sqlite');
const Path     = require('path');

exports.start = async (customSettings) => {
    const settings = customSettings || Envy(process.env.DOTENV_PATH || './.env');

    Raven.config(settings.sentryEndpoint).install();

    const client = new Commando.Client({owner: settings.discordOwnerId});

    client.on('error', (error) => {
        console.error(error);
        Raven.captureException(error);
    });

    client.on('warning', (message) => {
        console.warn(message);
    });

    client.on('debug', (message) => {
        console.log(message);
    });

    client.on('ready', () => {
        // NOTIFY IN #BLACKMESA
        console.log('READY');
    });

    client.on('disconnect', () => {
        console.warn('Disconnected!');
    });

    client.on('reconnecting', () => {
        console.warn('Reconnecting...');
    });

    client.on('commandError', (command, error) => {
        if (error instanceof Commando.FriendlyError) {
            return;
        }

        console.error(`Error in command ${command.groupID}:${command.memberName}`, error);
        Raven.captureException(error);
    });

    client.on('commandBlocked', (msg, reason) => {
        console.log(`Command ${msg.command ? `${msg.command.groupID}:${msg.command.memberName}` : ''} blocked; ${reason}`);
    });

    client.on('commandPrefixChange', (guild, prefix) => {
        console.log(`Prefix ${prefix === '' ? 'removed' : `changed to ${prefix || 'the default'}`} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`);
    });

    client.on('commandStatusChange', (guild, command, enabled) => {
        console.log(`Command ${command.groupID}:${command.memberName} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`);
    });

    client.on('groupStatusChange', (guild, group, enabled) => {
        console.log(`Group ${group.id} ${enabled ? 'enabled' : 'disabled'} ${guild ? `in guild ${guild.name} (${guild.id})` : 'globally'}.`);
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
        throw error;
    });

    exports.start().catch((error) => {
        console.error(`Error`, error);
        throw error;
    });
}

