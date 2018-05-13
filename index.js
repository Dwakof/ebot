'use strict';

const Envy     = require('envy');
const Raven    = require('raven');
const Commando = require('discord.js-commando');
const Sqlite   = require('sqlite');
const Path     = require('path');
const Pino     = require('pino');

const Events = require('./lib/events');

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

    Events.bind(client);

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
