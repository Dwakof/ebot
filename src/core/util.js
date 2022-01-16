'use strict';

const { requireDirSync } = require('./util/fs');

module.exports = requireDirSync(`${ __dirname }/util`).reduce((acc, file) => ({ ...acc, ...file }), {});
