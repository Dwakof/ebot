'use strict';

const { Chain } = require('./chain');

module.exports = {

    async mimicUser(client, guildId, userId, initialState) {

        const { Model } = client.providers.mimic.models;

        const member = await Model.query().findById([guildId, userId]).throwIfNotFound();

        const model = Chain.fromJSON(member.model);

        return model.walk(initialState).join(' ');
    }
};
