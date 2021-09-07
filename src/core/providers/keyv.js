'use strict';

const { Provider } = require('discord-akairo');
const Keyv         = require('keyv');
const { KeyvFile } = require('keyv-file');

const CoreUtil = require('../util');

/**
 * Provider using the `keyv` interface library.
 *
 * @param {String|Keyv}       store          - Keyv store or connection string
 *
 * @extends {Provider}
 */
module.exports = class KeyvProvider extends Provider {

    constructor(store) {

        super();

        if (store instanceof Keyv) {

            this.store = store;
            return;
        }

        if (CoreUtil.isString(store) && store.length > 0) {

            if (store.indexOf('://') < 0) {

                this.store = new Keyv({ store : new KeyvFile({ filename : store, writeDelay : 100 }) });
                return;
            }

            this.store = new Keyv(store);
            return;
        }

        /**
         * Keyv store.
         * @type {Keyv}
         */
        this.store = new Keyv();
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    async init() {

        // No need
    }

    /**
     * Gets a value.
     *
     * @param {string} namespace - ID of entry.
     * @param {string} key - The key to get.
     * @param {any} [defaultValue] - Default value if not found or null.
     * @returns {any}
     */
    async get(namespace, key, defaultValue) {

        return (await this.store.get(`${ namespace }_${ key }`)) || defaultValue;
    }

    /**
     * Sets a value.
     *
     * @param {string} namespace - ID of entry.
     * @param {string} key - The key to set.
     * @param {any} value - The value.
     * @returns {Promise<any>}
     */
    set(namespace, key, value) {

        return this.store.set(`${ namespace }_${ key }`, value);
    }

    /**
     * Deletes a value.
     *
     * @param {string} namespace - ID of entry.
     * @param {string} key - The key to delete.
     * @returns {Promise<any>}
     */
    delete(namespace, key) {

        return this.store.delete(`${ namespace }_${ key }`);
    }

    /**
     * Clears an entry.
     *
     * @returns {Promise<any>}
     */
    clear(namespace) {

        return this.store.clear();
    }
};
