'use strict';

const { EventEmitter } = require('events');

class Task extends EventEmitter {

    #values = new Map();
    #executor;

    constructor(executor) {

        super();

        this.set({
            doing   : false,
            done    : false,
            failed  : false,
            startAt : null,
            endAt   : null
        });

        this.#executor = executor;
    }

    increase(key, value = 1) {

        return this.set({ [key] : (this.#values.get(key) || 0) + value });
    }

    set(values = {}) {

        const previous = {};

        for (const [key, value] of Object.entries(values)) {

            previous[key] = this.get(key);
            this.#values.set(key, value);
        }

        this.emit('update', this, values, previous);

        return this;
    }

    start() {

        this.set({ doing : true, startAt : new Date() });

        this.emit('start', this);

        return this;
    }

    done() {

        this.set({ doing : false, done : true, endAt : new Date() });

        this.emit('done', this);
        this.emit('resolve', this);

        return this;
    }

    enforceStop() {

        this.set({ doing : false, endAt : this.get('endAt') ?? new Date() });
        this.emit('resolve', this);

        return this;
    }

    failed(error) {

        this.set({ doing : false, done : false, failed : true, endAt : new Date(), error });

        this.emit('failed', this);
        this.emit('reject', this);

        return this;
    }

    took() {

        if (!this.get('done')) {

            return -Infinity;
        }

        return this.get('endAt') - this.get('startAt');
    }

    get(key) {

        return this.#values.get(key);
    }

    getAll() {

        return Object.fromEntries(this.#values);
    }

    toJSON() {

        return this.getAll();
    }

    then(fulfil, reject) {

        this.start();

        this.once('failed', () => {

            reject(this.get('error'));
        });

        this.#executor(this)
            .then(() => fulfil(this.getAll()))
            .catch((error) => {

                this.failed(error);
            });
    }
}

module.exports = { Task };
