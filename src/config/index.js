'use strict';

const Path       = require('path');
const Confidence = require('@hapipal/confidence');
const Dotenv     = require('dotenv');

const Pkg = require('../../package.json');

Dotenv.config({ path : process.env.DOTENV_PATH || Path.join(__dirname, '../../.env') });

const knexDefault = new Confidence.Store({
    host     : { $env : 'POSTGRES_HOST', $default : 'localhost' },
    user     : { $env : 'POSTGRES_USER', $default : 'ebot' },
    password : { $env : 'POSTGRES_PASS', $default : 'ebot' },
    port     : { $env : 'POSTGRES_PORT', $coerce : 'number', $default : 5432 }
}).get('/');

const store = new Confidence.Store({
    version : Pkg.version,
    ebot    : {
        cacheWarmup : {
            guilds : { $env : 'EBOT_CACHE_WARMUP_GUILDS', $coerce : 'array', $default : [] },
            users  : { $env : 'EBOT_CACHE_WARMUP_USERS', $coerce : 'array', $default : [] }
        }
    },
    discord : {
        $filter     : { $env : 'NODE_ENV' },
        $base       : {
            partials : { $env : 'DISCORD_PARTIALS', $coerce : 'array' },
            ownerId  : { $env : 'DISCORD_OWNER_IDS', $coerce : 'array' },
            token    : { $env : 'DISCORD_TOKEN' },
            prefix   : { $env : 'DISCORD_COMMAND_PREFIX', $default : '!' }
        },
        development : {
            presence : {
                status   : 'online',
                afk      : false,
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
                    name        : `Ebot | ${ process.env.DISCORD_COMMAND_PREFIX || '!' }help`,
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
        production  : {}
    },
    sentry  : {
        $filter     : { $env : 'NODE_ENV' },
        $base       : {
            enabled          : false,
            dsn              : { $env : 'SENTRY_ENDPOINT' },
            release          : `ebot@${ Pkg.version }`,
            environment      : { $env : 'NODE_ENV' },
            tracesSampleRate : { $env : 'SENTRY_TRACE_SAMPLE_RATE', $coerce : 'number', $default : 1.0 }
        },
        development : {
            enabled : { $env : 'EBOT_SENTRY_ENABLED', $coerce : 'boolean', $default : false }
        },
        production  : {
            enabled : true
        }
    },
    plugins : {
        karma        : {
            knex : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'KARMA_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'KARMA_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'KARMA_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'KARMA_POSTGRES_DB', $default : 'karma' },
                    port     : { $env : 'KARMA_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            }
        },
        mimic        : {
            knex : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'MIMIC_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'MIMIC_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'MIMIC_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'MIMIC_POSTGRES_DB', $default : 'mimic' },
                    port     : { $env : 'MIMIC_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            }
        },
        reactionRole : {
            knex : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'REACTION_ROLE_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'REACTION_ROLE_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'REACTION_ROLE_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'REACTION_ROLE_POSTGRES_DB', $default : 'reaction_role' },
                    port     : { $env : 'REACTION_ROLE_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            }
        },
        weather      : {
            openWeatherApiKey : { $env : 'OPEN_WEATHER_API_KEY' },
            LocationIQApiKey  : { $env : 'LOCATION_IQ_API_KEY' }
        }
    }
});

module.exports = store.get('/');
