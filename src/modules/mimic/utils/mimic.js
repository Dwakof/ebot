'use strict';

const { Chain } = require('./chain');

module.exports = {

    async mimicUser(client, guildId, userId, initialState) {

        const { Mimic } = client.providers('mimic');

        const { Model } = Mimic.models;

        const member = await Model.query().findById([guildId, userId]).throwIfNotFound();

        const model = Chain.fromJSON(member.model);

        return model.walk(initialState).join(' ');
    }
};
