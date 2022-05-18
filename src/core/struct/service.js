'use strict';

const { KeyvLruManagedTtl } = require('keyv-lru');

const Util = require('../util');

class Service {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     * @param {String}     module
     */
    constructor(client, module) {

        this.client = client;
        this.module = module;
        this.id     = new.target.name;

        if (this.constructor.caching) {

            this.#caching(this.constructor.caching);
        }
    }

    /**
     * Method to override that is called when the client is started.
     */
    init() {

    }

    services(module = this.module) {

        return this.client.services(module);
    }

    views(module = this.module) {

        return this.client.views(module);
    }

    providers(module = this.module) {

        return this.client.providers(module);
    }

    /**
     * @param {Object<String, {generateKey : Function, cache : Object}>} options
     */
    #caching(options) {

        for (const [methodName, { generateKey = (...args) => args.join('-'), cache }] of Object.entries(options)) {

            const segment = new KeyvLruManagedTtl({ max : 1000, ttl : 3e9 * 24 * 7, ...cache });

            const method = this[methodName];

            this[methodName] = async (...args) => {

                const key = generateKey(...args);

                let result = segment.get(key);

                if (result !== undefined && result !== null) {

                    return result;
                }

                result = method.apply(this, args);

                if (Util.isPromise(result)) {

                    result = await result;
                }

                segment.set(key, result);

                return result;
            };

            this[methodName].cache = {

                get size() {

                    return segment.size;
                },

                get : (...args) => {

                    const key = generateKey(...args);

                    return segment.get(key);
                },

                clear : () => {

                    return segment.clear();
                },

                evictExpired : () => {

                    return segment.evictExpired();
                }
            };
        }
    }
}

module.exports = Service;
