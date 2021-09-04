'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const CoreUtil       = require('./util');
const { CoreEvents } = require('./constants');

class Module {

    #name;
    #path;

    #client;

    #commands   = new Map();
    #listeners  = new Map();
    #inhibitors = new Map();
    #providers  = new Map();

    constructor(name, path) {

        this.#name = name;
        this.#path = path;
    }

    async load(client) {

        this.#client = client;

        const components = await Fs.readdir(this.#path);

        if (components.includes('providers')) {

            await this.registerProviders();
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

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'commands'), true)) {

            try {

                const command = this.#client.commandHandler.load(file);

                this.#commands.set(command.id, { path, command });
            }
            catch (error) {

                throw new Error(`Could not register command ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async registerListeners() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'listeners'), true)) {

            try {

                const listener = this.#client.listenerHandler.load(file);

                this.#listeners.set(file.id, { path, listener });
            }
            catch (error) {

                throw new Error(`Could not register listener ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async registerInhibitors() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'inhibitors'), true)) {

            try {

                const inhibitor = this.#client.inhibitorHandler.load(file);

                this.#inhibitors.set(inhibitor.id, { path, inhibitor });
            }
            catch (error) {

                throw new Error(`Could not register inhibitor ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async registerProviders() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'providers'), true)) {

            try {

                let id;
                let provider;

                if (typeof file === 'function') {

                    ({ id, provider } = await file(this.#client));
                }
                else {

                    ({ id, provider } = file);
                }

                if (this.#providers.has(id)) {

                    throw new Error('A provider under the same ID was already registered');
                }

                this.#providers.set(id, { path, provider });

                this.#client.logger.trace({
                    event    : CoreEvents.PROVIDER_REGISTERED,
                    emitter  : 'core',
                    module   : this.#name,
                    provider : id
                });
            }
            catch (error) {

                throw new Error(`Could not register provider ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async init() {

        for (const [id, { provider }] of this.#providers.entries()) {

            await provider.init();

            this.#client.logger.debug({
                event    : CoreEvents.PROVIDER_INITIALIZED,
                emitter  : 'core',
                module   : this.#name,
                provider : id
            });
        }
    }

    providers() {

        return Array.from(this.#providers.entries())
            .reduce((providers, [id, { provider }]) => {

                return { ...providers, [this.#client.util.capitalize(id)] : provider };
            }, {});
    }
}

module.exports = Module;
