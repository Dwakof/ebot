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

        for (const name of await Fs.readdir(Path.join(this.#path, 'commands'))) {

            const path = Path.join(this.#path, 'commands', name);

            const command = this.#client.commandHandler.load(require(Path.join(this.#path, 'commands', name)));

            this.#commands.set(name, { path, command });
        }
    }

    async registerListeners() {

        for (const name of await Fs.readdir(Path.join(this.#path, 'listeners'))) {

            const path = Path.join(this.#path, 'listeners', name);

            const listener = this.#client.listenerHandler.load(require(Path.join(this.#path, 'listeners', name)));

            this.#listeners.set(name, { path, listener });
        }
    }

    async registerInhibitors() {

        for (const name of await Fs.readdir(Path.join(this.#path, 'inhibitors'))) {

            const path = Path.join(this.#path, 'inhibitors', name);

            const inhibitor = this.#client.inhibitorHandler.load(require(Path.join(this.#path, 'inhibitors', name)));

            this.#inhibitors.set(name, { path, inhibitor });
        }
    }

    async registerProvider() {

        this.#provider = await this.#client.registerProvider(require(Path.join(this.#path, 'provider')));
    }
}

module.exports = Module;
