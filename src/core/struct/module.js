'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

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

    async registerServices() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'services'), true)) {

            try {

                if (!file instanceof Service) {

                    throw new Error('Only instance of Service can be registered as service');
                }

                const service = new file(this.#client);
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

                throw new Error(`Could not register service ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async registerViews() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'views'), true)) {

            try {

                if (!file instanceof View) {

                    throw new Error('Only instance of View can be registered as view');
                }

                const view = new file(this.#client);
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

                throw new Error(`Could not register view ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
            }
        }
    }

    async registerApplicationCommands() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'applicationCommands'), true)) {

            try {

                const applicationCommand = this.#client.applicationCommandHandler.load(file);

                this.#applicationCommands.set(applicationCommand.id, { path, applicationCommand });
            }
            catch (error) {

                throw new Error(`Could not register application command ${ name } from module ${ this.#name } because of : ${ error.toString() }`);
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
