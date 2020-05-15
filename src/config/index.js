'use strict';

const Path       = require('path');
const Confidence = require('confidence');
const Dotenv     = require('dotenv');

const Pkg = require('../../package.json');

Dotenv.config({ path : process.env.DOTENV_PATH || Path.join(__dirname, '../../.env') });

const store = new Confidence.Store({
    version : Pkg.version,
    discord : {
        $filter     : { $env : 'NODE_ENV' },
        $base       : {
            ownerId : { $env : 'DISCORD_OWNER_ID' },
            token   : { $env : 'DISCORD_TOKEN' }
        },
        development : {
            presence : {
                status   : 'dnd',
                afk      : true,
                activity : {
                    type        : 'WATCHING',
                    name        : 'my owner work on me',
                    application : 'my owner work on me'
                }
            }
        },
        production  : {
            presence : {
                status   : 'online',
                afk      : false,
                activity : {
                    type        : 'PLAYING',
                    name        : 'Ebot',
                    application : 'Ebot'
                }
            }
        }
    },
    logger  : {
        $filter     : { $env : 'NODE_ENV' },
        $base       : {
            name        : 'ebot',
            level       : { $env : 'LOG_LEVEL', $default : 'info' },
            prettyPrint : false
        },
        development : {
            level       : { $env : 'LOG_LEVEL', $default : 'debug' },
            prettyPrint : true
        },
        production  : {
            level : { $env : 'LOG_LEVEL', $default : 'warn' }
        }
    },
    sentry  : {
        $filter     : { $env : 'NODE_ENV' },
        $base       : {
            enabled     : false,
            dsn         : { $env : 'SENTRY_ENDPOINT' },
            release     : `ebot@${ Pkg.version }`,
            environment : { $env : 'NODE_ENV' }
        },
        development : {},
        production  : {
            enabled : true
        }
    },
    plugins : {
        weather : {
            openWeatherApiKey : { $env : 'OPEN_WEATHER_API_KEY' },
            LocationIQApiKey  : { $env : 'LOCATION_IQ_API_KEY' }
        }
    }
});

module.exports = store.get('/');
