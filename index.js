'use strict';

const Client = require('./src/core/client');

const UtilPlugin = require('./src/plugins/utils');
const WeatherPlugin = require('./src/plugins/weather');

exports.deployment = async () => {

    const client = new Client(require('./src/config'));

    client.register(new UtilPlugin());
    client.register(new WeatherPlugin());

    await client.start();

    return client;
};

if (!module.parent) {
    return exports.deployment();
}
