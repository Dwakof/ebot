'use strict';

const { Service } = require('../../../core');

/**
 * @class
 * @type {StoreService}
 */
module.exports = class StoreService extends Service {

    /**
     * @template [T=Object]
     *
     * @typedef {Object} StoreService~Entry
     *
     * @property {String} module
     * @property {String} namespace
     * @property {String} guildId
     * @property {String} id
     * @property {T}      value
     * @property {Date}   createdAt
     * @property {Date}   updatedAt
     */

    /**
     * @template [T=Object]
     *
     * @param {String} module
     * @param {String} namespace
     * @param {String} guildId
     * @param {String} id
     * @param {Object} value
     *
     * @return {Promise<StoreService~Entry<T>>}
     */
    async set(module, namespace, guildId, id, value) {

        StoreService.check(module, 'module');
        StoreService.check(namespace, 'namespace');

        const { Store } = this.providers();

        const entry = await Store.models.Store.query()
            .insert({ module, namespace, guildId, id, value })
            .onConflict(Store.models.Store.idColumn)
            .merge();

        return this.#toObject(entry);
    }

    /**
     * @template [T=Object]
     *
     * @param {String} module
     * @param {String} namespace
     * @param {String} guildId
     * @param {String} id
     *
     * @return {Promise<StoreService~Entry<T>>}
     */
    async get(module, namespace, guildId, id) {

        StoreService.check(module, 'module');
        StoreService.check(namespace, 'namespace');

        const { Store } = this.providers();

        const entry = await Store.models.Store.query().findById([module, namespace, guildId, id]);

        return entry ? this.#toObject(entry) : null;
    }

    /**
     * @template [T=Object]
     *
     * @param {String}   module
     * @param {String}   namespace
     * @param {String}   [guildId]
     * @param {String[]} [ids]
     *
     * @return {Promise<Array<StoreService~Entry<T>>>}
     */
    async list(module, namespace, guildId, ids = []) {

        StoreService.check(module, 'module');
        StoreService.check(namespace, 'namespace');

        const { Store } = this.providers();

        if (ids.length > 0) {

            StoreService.check(guildId, 'guildId');

            const entries = await Store.models.Store.query().findByIds(ids.map((id) => [module, namespace, guildId, id]));

            return entries.map(this.#toObject);
        }

        const query = Store.models.Store.query().where({ module, namespace });

        if (guildId) {

            query.where({ guildId });
        }

        const entries = await query;

        return entries.map(this.#toObject);
    }

    /**
     * @template [T=Object]
     *
     * @param {String}   module
     * @param {String}   namespace
     * @param {String}   guildId
     *
     * @return {Promise<Array<String>>}
     */
    async listIds(module, namespace, guildId) {

        StoreService.check(module, 'module');
        StoreService.check(namespace, 'namespace');
        StoreService.check(namespace, 'guildId');

        const { Store } = this.providers();

        const ids = await Store.models.Store.query().select('id').where({ module, namespace, guildId });

        return ids.map(({ id }) => id);
    }

    /**
     * @template [T=Object]
     *
     * @param {String} module
     * @param {String} namespace
     * @param {String} [guildId]
     * @param {String} [id]
     * @returns {Promise<Number>}
     */
    async delete(module, namespace, guildId, id) {

        StoreService.check(module, 'module');
        StoreService.check(namespace, 'namespace');

        const { Store } = this.providers();

        // noinspection ES6RedundantAwait
        const query = Store.models.Store.query().delete().where({ module, namespace, id });

        if (guildId) {

            query.where({ guildId });
        }

        return await query;
    }

    static check(variable, name) {

        if (!variable) {

            throw new Error(`${ name } cannot be falsy`);
        }
    }

    /**
     * @template [T=Object]
     *
     * @param {String} module
     * @param {String} namespace
     * @param {String} guildId
     * @param {String} id
     * @param {T}      value
     * @param {Date|String|Number} createdAt
     * @param {Date|String|Number} updatedAt
     *
     * @return {StoreService~Entry<T>}
     */
    #toObject({ module, namespace, guildId, id, value, createdAt, updatedAt }) {

        return { module, namespace, guildId, id, value, createdAt : new Date(createdAt), updatedAt : new Date(updatedAt) };
    }
};
