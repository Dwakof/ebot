'use strict';

const Path = require('node:path');
const FsP  = require('node:fs/promises');

const Knex                                = require('knex');
const { initialize, Model, AjvValidator } = require('objection');
const AjvFormat                           = require('ajv-formats');

const KnexPGlite = require('knex-pglite');
const { PGlite } = require('@electric-sql/pglite');
const { NodeFS } = require('@electric-sql/pglite/nodefs');

const { KnexAsyncIterator } = require('../../util');

Knex.QueryBuilder.extend('asyncIterator', function () {

    this[Symbol.asyncIterator] = () => {

        return new KnexAsyncIterator(this);
    };

    return this;
});

class ObjectionModel extends Model {

    static createValidator() {

        return new AjvValidator({
            options : { allowUnionTypes : true },
            onCreateAjv(ajv) {

                AjvFormat(ajv);
            }
        });
    }
}

module.exports = class ObjectionProvider {

    #knex;
    #settings;

    /**
     * @type {Object.<Model>}
     */
    #models;

    static ObjectionModel = ObjectionModel;

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
        this.#models   = models.reduce((acc, model) => ({ ...acc, [model.name] : model }), {});
    }

    /**
     * Initializes the provider.
     * @returns {Promise<void>}
     */
    async init() {

        switch (this.#settings.client) {

            case 'pglite': {

                try {

                    const path = Path.join(this.#settings.connection.fs, this.#settings.connection.database);

                    await FsP.mkdir(path, { recursive : true });

                    const pg = await PGlite.create({ fs : new NodeFS(path) });

                    this.#knex = Knex({ client : KnexPGlite, dialect : 'postgres', connection : () => ({ pglite : pg }), migrations : this.#settings.migrations });
                }
                catch (error) {

                    throw new Error(`Unable to create a PGLite instance: ${ error.message }`, { cause : error });
                }

                break;
            }

            case 'sqlite' : {

                const path = Path.join(this.#settings.connection.fs, `${ this.#settings.connection.database }.sqlite`);

                this.#knex = Knex({ client : 'better-sqlite3', connection : { filename : path }, migrations : this.#settings.migrations, useNullAsDefault : true });

                break;
            }

            case 'pg' : {

                this.#knex = Knex(this.#settings);

                break;
            }

            default : {

                throw new Error(`Unsupported client ${ this.#settings.client }`);
            }
        }

        await this.ping();

        try {

            await this.#knex.migrate.latest(this.#settings.migrations);
        }
        catch (error) {

            throw new Error(`Unable to run migrations: ${ error.message }`, { cause : error });
        }

        Object.values(this.models).forEach((model) => model.knex(this.#knex));

        await initialize(this.#knex, Object.values(this.#models));
    }

    ping() {

        return this.#knex.queryBuilder().select(this.#knex.raw('1')).timeout(1000);
    }

    /**
     * @returns {*}
     */
    get models() {

        return this.#models;
    }

    get knex() {

        return this.#knex;
    }
};
