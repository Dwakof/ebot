'use strict';

const Fs   = require('fs').promises;
const Path = require('path');

const Client = require('./src/core/client');
const Plugin = require('./src/core/plugin');

exports.deployment = async () => {

    const client = new Client(require('./src/config'));

    await client.initialize();

    const plugins = await Fs.readdir(Path.join(__dirname, './src/plugins'));

    for (const plugin of plugins) {

        const pluginToImport = require(Path.join(__dirname, './src/plugins/', plugin));

        if (pluginToImport.prototype instanceof Plugin) {

            await client.registerPlugin(new pluginToImport());
        }
    }

    await client.start();

    return client;
};

if (!module.parent) {
    return exports.deployment();
}
