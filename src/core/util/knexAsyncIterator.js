'use strict';

class KnexAsyncIterator {

    constructor(query) {

        this.stream = query.stream();
        this.buffer = [];

        this.stream.on('data', this.onData);
        this.stream.on('error', this.onError);
        this.stream.on('end', this.onEnd);
    }

    done = false;

    onData = (data) => {

        this.pause();
        this.push({ done : false, value : data });
    };

    push = (payload) => {

        if (this.resolve) {
            this.resolve(payload);
            this.resolve = null;
            this.reject  = null;
        }
        else {
            this.buffer.push(payload);
        }
    };

    onError = (error) => {

        this.finalCleanup();

        if (this.reject) {

            this.reject(error);
            this.reject  = null;
            this.resolve = null;
        }
        else {
            throw error;
        }
    };

    onEnd = () => {

        this.finalCleanup();
        this.push({
            done : true
        });
    };

    pause = () => {

        this.stream.pause();
    };

    finalCleanup = () => {

        this.stream.off('data', this.onData);
        this.stream.off('error', this.onError);
        this.stream.off('end', this.onEnd);
        this.done = true;
    };

    next() {

        if (this.buffer.length) {
            return this.buffer.shift();
        }

        if (this.done) {
            return { done : true };
        }

        return new Promise((resolve, reject) => {

            this.resolve = resolve;
            this.reject  = reject;
            this.stream.resume();
        });
    }
}

module.exports = { KnexAsyncIterator };
