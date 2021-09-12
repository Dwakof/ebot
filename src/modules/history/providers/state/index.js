'use strict';

const { KeyvProvider } = require('../../../../core');

module.exports = () => {

    return {
        id       : 'state',
        provider : new KeyvProvider()
    };
};
