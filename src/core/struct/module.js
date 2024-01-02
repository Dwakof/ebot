'use strict';

const Fs   = require('fs/promises');
const Path = require('path');

const { Category } = require('discord-akairo');

const CoreUtil       = require('../util');
const { CoreEvents } = require('../constants');

const Service = require('./service');
const View    = require('./view');

/**
 * @class
 * @memberof Module
 */
class Store {

    #name;
    #service;

    constructor(name, storeService) {

        this.#name    = name;
        this.#service = storeService;
    }

    /**
     * @template [T=Object]
     *
     * @param {String} namespace
     * @param {String} guildId
     * @param {String} id
     *
     * @return {Promise<StoreService~Entry<T>>}
     */
    get(namespace, guildId, id) {

        return this.#service.get(this.#name, namespace, guildId, id);
    }

    /**
     * @template [T=Object]
     *
     * @param {String} namespace
     * @param {String} guildId
     * @param {String} id
     * @param {Object} value
     *
     * @return {Promise<StoreService~Entry<T>>}
     */
    set(namespace, guildId, id, value) {

        return this.#service.set(this.#name, namespace, guildId, id, value);
    }

    /**
     * @template [T=Object]
     *
     * @param {String}   namespace
     * @param {String}   [guildId]
     * @param {String[]} [ids]
     *
     * @return {Promise<Array<StoreService~Entry<T>>>}
     */
    list(namespace, guildId, ids) {

        return this.#service.list(this.#name, namespace, guildId, ids);
    }

    /**
     * @template [T=Object]
     *
     * @param {String}   namespace
     * @param {String}   guildId
     *
     * @return {Promise<Array<String>>}
     */
    listIds(namespace, guildId) {

        return this.#service.listIds(this.#name, namespace, guildId);
    }

    /**
     * @template [T=Object]
     *
     * @param {String} namespace
     * @param {String} [guildId]
     * @param {String} [id]
     * @returns {Promise<Number>}
     */
    delete(namespace, guildId, id) {

        return this.#service.delete(this.#name, namespace, guildId, id);
    }
}

class Module {

    #name;
    #path;
    #settings;

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    #client;

    #commands            = new Map();
    #listeners           = new Map();
    #inhibitors          = new Map();
    #interactions        = new Map();
    #providers           = new Map();
    #services            = new Map();
    #views               = new Map();
    #applicationCommands = new Map();

    /**
     * @type {Module~Store}
     */
    #store;

    constructor(name, path) {

        this.#name = name;
        this.#path = path;
    }

    /**
     * @return {Module~Store}
     */
    get store() {

        return this.#store;
    }

    /**
     * @param {EbotClient} client
     * @param {Object}     settings
     *
     * @return {Promise<void>}
     */
    async load(client, settings) {

        this.#client   = client;
        this.#settings = settings;

        const components = await Fs.readdir(this.#path);

        if (components.includes('providers')) {

            await this.registerProviders();
        }

        if (this.#name !== 'core') {

            this.registerStore();
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

        if (components.includes('interactions')) {

            await this.registerInteractions();
        }
    }

    registerStore() {

        const { StoreService } = this.#client.services('core');

        this.#store = new Store(this.#name, StoreService);
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

                this.#client.logger.error({ err : error });

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

    registerInteractions() {

        return this.registerAkairoModule(this.#interactions, this.#client.interactionHandler, 'interactions', 'interaction');
    }

    async registerProviders() {

        for (const { name, path, file } of await CoreUtil.requireDir(Path.join(this.#path, 'providers'), true)) {

            try {

                let id;
                let provider;

                if (typeof file === 'function') {

                    ({ id, provider } = await file(this.#client, this.#settings));
                }
                else {

                    ({ id, provider } = file);
                }

                if (this.#providers.has(id)) {

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('A provider under the same ID was already registered');
                }

                this.#providers.set(id, { path, provider });

                this.#client.logger.trace({
                    msg      : `Provider ${ this.#name }.${ id } has been registered`,
                    event    : CoreEvents.PROVIDER_REGISTERED,
                    emitter  : 'core',
                    metadata : {
                        module   : this.#name,
                        provider : id
                    }
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

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Only instance of Service can be registered as service');
                }

                const service = new file(this.#client, this.#name);
                const id      = service.id;

                if (this.#services.has(id)) {

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('A service under the same name was already registered');
                }

                this.#services.set(id, { path, service });

                this.#client.logger.trace({
                    msg      : `Service ${ this.#name }.${ id } has been registered`,
                    event    : CoreEvents.SERVICE_REGISTERED,
                    emitter  : 'core',
                    metadata : {
                        module  : this.#name,
                        service : id
                    }
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

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Only instance of View can be registered as view');
                }

                const view = new file(this.#client, this.#name);
                const id   = view.id;

                if (this.#views.has(id)) {

                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('A view under the same name was already registered');
                }

                this.#views.set(id, { path, view });

                this.#client.logger.trace({
                    msg      : `View ${ this.#name }.${ id } has been registered`,
                    event    : CoreEvents.VIEW_REGISTERED,
                    emitter  : 'core',
                    metadata : {
                        module : this.#name,
                        view   : id
                    }
                });
            }
            catch (error) {

                throw new Error(`Could not register view ${ name } from module ${ this.#name } because of : ${ error.toString() }`, { cause : error });
            }
        }
    }

    async init() {

        for (const [id, { provider }] of this.#providers.entries()) {

            await provider.init(this.#settings);

            this.#client.logger.debug({
                msg      : `Provider ${ this.#name }.${ id } has been initialized`,
                event    : CoreEvents.PROVIDER_INITIALIZED,
                emitter  : 'core',
                metadata : {
                    module   : this.#name,
                    provider : id
                }
            });
        }

        for (const [id, { service }] of this.#services.entries()) {

            await service.init(this.#settings);

            this.#client.logger.debug({
                msg      : `Service ${ this.#name }.${ id } has been initialized`,
                event    : CoreEvents.SERVICE_INITIALIZED,
                emitter  : 'core',
                metadata : {
                    module  : this.#name,
                    service : id
                }
            });
        }

        for (const [id, { view }] of this.#views.entries()) {

            await view.init(this.#settings);

            this.#client.logger.debug({
                msg      : `View ${ this.#name }.${ id } has been initialized`,
                event    : CoreEvents.VIEW_INITIALIZED,
                emitter  : 'core',
                metadata : {
                    module : this.#name,
                    view   : id
                }
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
}

module.exports = Module;
