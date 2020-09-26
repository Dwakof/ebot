'use strict';

const Fs   = require('fs').promises;
const Path = require('path');

const Client = require('./core/client');

exports.deployment = async () => {

    const client = new Client(require('./config'));

    await client.initialize();

    for (const provider of await Fs.readdir(Path.join(__dirname, './providers'))) {

        await client.registerProvider(require(Path.join(__dirname, './providers/', provider)));
    }

    client.registerCommandHandler({ directory : Path.join(__dirname, './commands') });

    client.registerInhibitorHandler({ directory : Path.join(__dirname, './inhibitors') });

    client.registerListenerHandler({ directory : Path.join(__dirname, './listeners') });

    await client.start();

    return client;
};

if (!module.parent) {
    return exports.deployment();
}
