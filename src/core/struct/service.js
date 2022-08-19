'use strict';

const { DateTime }          = require('luxon');
const { KeyvLruManagedTtl } = require('keyv-lru');
const Hoek                  = require('@hapi/hoek');
const Cron                  = require('node-cron');

const Util           = require('../util');
const { CoreEvents } = require('../constants');

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

        if (this.constructor.cron) {

            this.#cron(this.constructor.cron);
        }
    }

    /**
     * Method to override that is called when the client is started.
     */
    init(settings) {

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
     * @return {Module~Store}
     */
    get store() {

        return this.client.store(this.module);
    }

    /**
     * @param {Object<String, {generateKey : Function, cache : Object}>} options
     */
    #caching(options) {

        for (const [methodName, { generateKey = (...args) => args.join('-'), cache = {} }] of Object.entries(options)) {

            const segment = new KeyvLruManagedTtl({ max : 1000, ttl : Util.DAY * 7, ...cache });

            const method = this[methodName];

            this.client.logger.info({
                msg     : `${ this.module }.${ this.id } created a cache segment "${ methodName }" with a default ttl of ${ Util.getTimeString(segment.defaultTtl) }`,
                event   : CoreEvents.CACHE_SEGMENT_CREATED,
                emitter : 'core'
            });

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

    #cron(cronDefinitions) {

        for (const [cron, { schedule, job, options = {} }] of Object.entries(cronDefinitions)) {

            Hoek.assert(Cron.validate(schedule), `Invalid cron schedule: ${ schedule } for cron ${ cron } in service ${ this.id } of module ${ this.module }`);

            let method = job;

            if (Util.isString(method)) {

                method = this[job];
            }

            this.client.logger.info({
                msg     : `${ this.module }.${ this.id } created a schedule "${ schedule }" for cron job ${ cron }`,
                event   : CoreEvents.SCHEDULE_CREATED,
                emitter : 'core'
            });

            Cron.schedule(schedule, async () => {

                const id    = Util.uuid();
                const start = DateTime.now();

                try {

                    this.client.logger.info({
                        msg     : `${ this.module }.${ this.id } Starting job "${ cron }" with id ${ id }`,
                        event   : CoreEvents.SCHEDULE_STARTED,
                        emitter : 'core'
                    });

                    await method.call(this, this.client);

                    this.client.logger.info({
                        msg     : `${ this.module }.${ this.id } Job "${ cron }" with id ${ id } finished in ${ Util.getTimeString(DateTime.now().diff(start)) }`,
                        event   : CoreEvents.SCHEDULE_ENDED,
                        emitter : 'core'
                    });
                }
                catch (err) {

                    this.client.logger.error({
                        msg     : `[${ this.module }.${ this.id }] Job "${ cron }" with id ${ id } failed in ${ Util.getTimeString(DateTime.now().diff(start)) }`,
                        event   : CoreEvents.SCHEDULE_FAILED,
                        emitter : 'core',
                        err
                    });
                }

            }, options);
        }
    }
}

module.exports = Service;
