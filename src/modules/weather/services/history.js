'use strict';

const { Service } = require('../../../core');

module.exports = class HistoryService extends Service {

    save(guildId, userId, result) {

        const { History }    = this.providers();
        const { CommonView } = this.views();

        const { Search } = History.models;

        return Search.query()
            .insert({ guildId, userId, search : CommonView.location(result) })
            .onConflict(Search.idColumn)
            .merge({ used : Search.raw('? + 1', [Search.ref('used')]) });
    }

    get(guildId, userId) {

        const { History } = this.providers();

        const { Search } = History.models;

        return Search.query().select('search').where({ guildId, userId }).orderBy('used', 'DESC');
    }
};
