'use strict';

const { Service } = require('../../../core');

const { Chain } = require('../utils');

module.exports = class MimicService extends Service {

    async getModel(guildId, userId) {

        const { Mimic } = this.providers();

        const { Model } = Mimic.models;

        const { model : json } = await Model.query().findById([guildId, userId]).throwIfNotFound();

        return Chain.fromJSON(json);
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

    static get caching() {

        return {
            getModel : {
                cache : {
                    ttl : 30e6,
                    max : 5
                }
            }
        };
    }
};

