'use strict';

const Path = require('path');

const { Client } = require('./core');

exports.deployment = async () => {

    const client = new Client(require('./config'));

    await client.initialize();

    await client.registerModules(Path.join(__dirname, './modules'));

    await client.start();

    return client;
};

if (!module.parent) {
    return exports.deployment();
}
