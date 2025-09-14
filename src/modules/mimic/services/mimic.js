'use strict';

const { Service, Util } = require('../../../core');

const { Chain } = require('../utils');

module.exports = class MimicService extends Service {

    static get caching() {

        return {
            getModel : {
                cache : {
                    ttl : 30 * Util.SECOND,
                    max : 5
                }
            }
        };
    }

    async getModel(guildId, userId) {

        const { Mimic } = this.providers();

        const { Model } = Mimic.models;

        const { model : buffer } = await Model.query().findById([guildId, userId]).throwIfNotFound();

        return Chain.decode(buffer);
    }

    async mimic(guildId, userId, initialState = '', retry = 5) {

        const model = await this.getModel(guildId, userId);

        let i        = 0;
        let response = '';

        do {

            response = model.walk(initialState || '').join(' ').trim();

            i++;

        } while ([initialState, ''].includes(response) && i < retry);

        if (response === '') {

            throw new Error(`Could not generate a non empty sentence after ${ i } retry`);
        }

        return response;
    }
};

