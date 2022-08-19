'use strict';

const { Service } = require('../../../core');

module.exports = class PromptService extends Service {

    async save(guildId, messageId, response) {

        const { value } = await this.store.set('prompt', guildId, messageId, { response });

        return value;
    }
};
