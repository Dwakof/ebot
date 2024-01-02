'use strict';

const Hoek = require('@hapi/hoek');

// eslint-disable-next-line no-unused-vars
const { CommandInteraction } = require('discord.js');

const { AkairoModule } = require('discord-akairo');

const Util = require('../../util');

/**
 * @typedef {AkairoModule} Interaction
 */
class Interaction extends AkairoModule {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @typedef {Object} InteractionConfig
     *
     * @property {Function<Promise>}  method
     * @property {Object}             options
     * @property {String}               options.customId
     */

    /**
     * @type {Map<String, InteractionConfig>}
     */
    #handlers = new Map();

    /**
     * @param {String}  id
     * @param {String}  description
     * @param {String}  category
     */
    constructor(id, { category } = {}) {

        super(id, { category });

        this.name = id;

        Hoek.assert(this.name, 'The interaction class must have a name.');

        for (const [interaction, config] of Object.entries(this.constructor.interactions)) {

            if (Util.isString(config)) {

                Hoek.assert(typeof this[config] === 'function', `The method ${ config } for Interaction ${ id } does not exist`);

                this.#handlers.set(interaction, { method : (i) => this[config](i), options : {} });
            }

            Hoek.assert(typeof this[config.method] === 'function', `The method ${ config.method } for Interaction ${ id } does not exist`);

            this.#handlers.set(config.customId ?? interaction, { ...config, method : (i) => this[config.method](i) });
        }
    }

    get interactions() {

        const result = {};

        for (const [key, { options }] of this.#handlers) {

            result[key] = options;
        }

        return result;
    }

    /**
     * @param id
     * @param {CommandInteraction} interaction
     * @return {Promise}
     */
    run(id, interaction) {

        if (!this.#handlers.has(id)) {

            throw new Error(`Handler ${ id } not found on Interaction ${ this.name } in category ${ this.categoryID }`);
        }

        return this.#handlers.get(id).method(interaction);
    }

    services(module = this.categoryID) {

        return this.client.services(module);
    }

    views(module = this.categoryID) {

        return this.client.views(module);
    }

    /**
     * @deprecated
     */
    providers(module = this.categoryID) {

        return this.client.providers(module);
    }
}

module.exports = Interaction;
