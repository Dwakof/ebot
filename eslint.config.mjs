/* eslint-disable n/no-unpublished-import */

import babelParser from '@babel/eslint-parser';
import jsdoc       from 'eslint-plugin-jsdoc';
import hapi        from '@hapi/eslint-plugin';
import node        from 'eslint-plugin-n';

export default [
    node.configs['flat/recommended-script'],
    ...hapi.configs.recommended,
    {
        ignores         : [
            'src/modules/mimic/utils/encoder.mts',
            'db'
        ],
        plugins         : { jsdoc },
        languageOptions : {
            globals : { node : true, es6 : true },
            parser  : babelParser
        },
        rules           : {
            'key-spacing' : 'off'
        }
    }
];
