'use strict';

const Knex                  = require('knex');
const { initialize, Model } = require('objection');

module.exports = class ObjectionProvider {

    #knex;
    #settings;

    /**
     * @type {Object.<String,Model>}
     */
    #models;

    /**
     *
     * @param settings
     * @param {Model[]} models
     */
    constructor(settings, models) {

        if (!Array.isArray(models)) {

            throw new Error('need a list of models');
        }

        this.#settings = settings;


        this.#models = models.reduce((acc, model) => {

            return { ...acc, [model.name] : model };
        }, {});
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    async init() {

        this.#knex = Knex(this.#settings);

        await this.ping();

        await this.#knex.migrate.latest();

        Object.values(this.models).forEach((model) => model.knex(this.#knex));

        await initialize(this.#knex, Object.values(this.#models));
    }

    async ping() {

        try {
            const value = await this.#knex.queryBuilder().select(this.#knex.raw('1'));

            return value;
        }
        catch (error) {

            throw error;
        }
    }

    /**
     *
     * @returns {*}
     */
    get models() {

        return this.#models;
    }

    get knex() {

        return this.#knex;
    }
};
