'use strict';

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

const { Service } = require('../../../core');

const { Chain } = require('../utils');

module.exports = class MimicService extends Service {

    async mimic(guildId, userId, initialState = '', retry = 5) {

        const { Mimic } = this.providers();

        const { Model } = Mimic.models;

        const { model : json } = await Model.query().findById([guildId, userId]).throwIfNotFound();

        const model = Chain.fromJSON(json);

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

