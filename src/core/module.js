'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

class Module {

    #name;
    #path;

    #client;

    #commands   = new Map();
    #listeners  = new Map();
    #inhibitors = new Map();
    #provider;

    constructor(name, path) {

        this.#name = name;
        this.#path = path;
    }

    async load(client) {

        this.#client = client;

        const components = await Fs.readdir(this.#path);

        if (components.includes('provider')) {

            await this.registerProvider();
        }

        if (components.includes('listeners')) {

            await this.registerListeners();
        }

        if (components.includes('commands')) {

            await this.registerCommands();
        }

        if (components.includes('inhibitors')) {

            await this.registerInhibitors();
        }
    }

    async registerCommands() {

        for (const { name, path, file } of await this.#client.utils.requireDir(Path.join(this.#path, 'commands'), true)) {

            const command = this.#client.commandHandler.load(file);

            this.#commands.set(name, { path, command });
        }
    }

    async registerListeners() {

        for (const { name, path, file } of await this.#client.utils.requireDir(Path.join(this.#path, 'listeners'), true)) {

            const listener = this.#client.listenerHandler.load(file);

            this.#listeners.set(name, { path, listener });
        }
    }

    async registerInhibitors() {

        for (const { name, path, file } of await this.#client.utils.requireDir(Path.join(this.#path, 'inhibitors'), true)) {

            const inhibitor = this.#client.inhibitorHandler.load(file);

            this.#inhibitors.set(name, { path, inhibitor });
        }
    }

    async registerProvider() {

        this.#provider = await this.#client.registerProvider(require(Path.join(this.#path, 'provider')));
    }
}

module.exports = Module;
