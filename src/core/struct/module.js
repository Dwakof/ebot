'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { Category } = require('discord-akairo');

const CoreUtil       = require('../util');
const { CoreEvents } = require('../constants');

const Service = require('./service');
const View    = require('./view');

class Module {

    #name;
    #path;

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    #client;

    #commands            = new Map();
    #listeners           = new Map();
    #inhibitors          = new Map();
    #providers           = new Map();
    #services            = new Map();
    #views               = new Map();
    #applicationCommands = new Map();

    constructor(name, path) {

        this.#name = name;
        this.#path = path;
    }

    /**
     * @param {EbotClient} client
     *
     * @return {Promise<void>}
     */
    async load(client) {

        this.#client = client;

        const components = await Fs.readdir(this.#path);

        if (components.includes('providers')) {

            await this.registerProviders();
        }

        if (components.includes('services')) {

            await this.registerServices();
        }

        if (components.includes('views')) {

            await this.registerViews();
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

        if (components.includes('applicationCommands')) {

            await this.registerApplicationCommands();
        }
    }

    async registerAkairoModule(collection, handler, subPath, type) {

        const category = new Category(this.#name);

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, subPath), true)) {

            try {

                const module = handler.load(file);

                module.categoryID = this.#name;

                if (this.#name !== 'default') {

                    handler.categories.get('default')?.delete(module.id);
                }

                category.set(module.id, module);

                if (!handler.categories.get(this.#name)) {

                    handler.categories.set(this.#name, category);
                }

                collection.set(module.id, { path, [type] : module });
            }
            catch (error) {

                throw new Error(`Could not register ${ type } ${ name } from module ${ this.#name } because of : ${ error.toString() }`, { cause : error });
            }
        }

        if (handler.categories.get('default')?.size === 0) {

            handler.categories.delete('default');
        }
    }

    registerCommands() {

        return this.registerAkairoModule(this.#commands, this.#client.commandHandler, 'commands', 'command');
    }

    registerListeners() {

        return this.registerAkairoModule(this.#listeners, this.#client.listenerHandler, 'listeners', 'listener');
    }

    registerInhibitors() {

        return this.registerAkairoModule(this.#inhibitors, this.#client.inhibitorHandler, 'inhibitors', 'inhibitor');
    }

    registerApplicationCommands() {

        return this.registerAkairoModule(this.#applicationCommands, this.#client.applicationCommandHandler, 'applicationCommands', 'applicationCommand');
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

                throw new Error(`Could not register provider ${ name } from module ${ this.#name } because of : ${ error.toString() }`, { cause : error });
            }
        }
    }

    async registerServices() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'services'), true)) {

            try {

                if (!file instanceof Service) {

                    throw new Error('Only instance of Service can be registered as service');
                }

                const service = new file(this.#client, this.#name);
                const id      = service.id;

                if (this.#services.has(id)) {

                    throw new Error('A service under the same name was already registered');
                }

                this.#services.set(id, { path, service });

                this.#client.logger.trace({
                    event   : CoreEvents.SERVICE_REGISTERED,
                    emitter : 'core',
                    module  : this.#name,
                    service : id
                });
            }
            catch (error) {

                throw new Error(`Could not register service ${ name } from module ${ this.#name } because of : ${ error.toString() }`, { cause : error });
            }
        }
    }

    async registerViews() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'views'), true)) {

            try {

                if (!file instanceof View) {

                    throw new Error('Only instance of View can be registered as view');
                }

                const view = new file(this.#client, this.#name);
                const id   = view.id;

                if (this.#views.has(id)) {

                    throw new Error('A view under the same name was already registered');
                }

                this.#views.set(id, { path, view });

                this.#client.logger.trace({
                    event   : CoreEvents.VIEW_REGISTERED,
                    emitter : 'core',
                    module  : this.#name,
                    view    : id
                });
            }
            catch (error) {

                throw new Error(`Could not register view ${ name } from module ${ this.#name } because of : ${ error.toString() }`, { cause : error });
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

        for (const [id, { service }] of this.#services.entries()) {

            await service.init();

            this.#client.logger.debug({
                event   : CoreEvents.SERVICE_INITIALIZED,
                emitter : 'core',
                module  : this.#name,
                service : id
            });
        }

        for (const [id, { view }] of this.#views.entries()) {

            await view.init();

            this.#client.logger.debug({
                event   : CoreEvents.VIEW_INITIALIZED,
                emitter : 'core',
                module  : this.#name,
                view    : id
            });
        }
    }

    providers() {

        return Array.from(this.#providers.entries())
            .reduce((providers, [id, { provider }]) => {

                return { ...providers, [this.#client.util.capitalize(id)] : provider };
            }, {});
    }

    services() {

        return Array.from(this.#services.entries())
            .reduce((services, [name, { service }]) => {

                return { ...services, [name] : service };
            }, {});
    }

    views() {

        return Array.from(this.#views.entries())
            .reduce((views, [name, { view }]) => {

                return { ...views, [name] : view };
            }, {});
    }

    applicationCommands() {}
}

module.exports = Module;
