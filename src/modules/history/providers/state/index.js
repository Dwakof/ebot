'use strict';

const KeyvProvider = require('../../../../core/providers/keyv');

module.exports = () => {

    return {
        id       : 'state',
        provider : new KeyvProvider()
    };
};
