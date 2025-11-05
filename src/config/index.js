'use strict';

const Path             = require('path');
const Confidence       = require('@hapipal/confidence');
const Dotenv           = require('dotenv');
const { ActivityType } = require('discord-api-types/v10');

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
    core    : {
        discord         : {
            $filter     : { $env : 'NODE_ENV' },
            $base       : {
                clientId : { $env : 'DISCORD_CLIENT_ID' },
                token    : { $env : 'DISCORD_TOKEN' },
                ownerID  : { $env : 'DISCORD_OWNER_IDS', $coerce : 'array' },
                prefix   : { $env : 'DISCORD_COMMAND_PREFIX', $default : '!' },
                partials : { $env : 'DISCORD_PARTIALS', $coerce : 'array' }
            },
            development : {
                presence : {
                    status     : 'online',
                    afk        : false,
                    activities : [
                        {
                            type : ActivityType.Playing,
                            name : `with my owner | ${ process.env.DISCORD_COMMAND_PREFIX || '!' }help`
                        }
                    ]
                }
            },
            production  : {
                presence : {
                    status     : 'online',
                    afk        : false,
                    activities : [
                        {
                            type : ActivityType.Playing,
                            name : `Ebot | ${ process.env.DISCORD_COMMAND_PREFIX || '!' }help`
                        }
                    ]
                }
            }
        },
        logger          : {
            $filter     : { $env : 'NODE_ENV' },
            $base       : {
                name   : 'ebot',
                level  : { $env : 'LOG_LEVEL', $default : 'info' },
                redact : [
                    'err.requestData.files[*].attachment',
                    'err.requestData.files[*].file'
                ]
            },
            development : {
                level     : { $env : 'LOG_LEVEL', $default : 'debug' },
                transport : {
                    target  : 'pino-pretty',
                    options : {
                        colorize      : { $env : 'LOG_COLOR', $coerce : 'boolean', $default : true },
                        ignore        : 'event,emitter,command,interaction,metadata',
                        messageFormat : '[{emitter}.{event}] : {msg}',
                        translateTime : true
                    }
                }
            },
            production  : {}
        },
        sentry          : {
            dsn              : { $env : 'SENTRY_ENDPOINT', $default : '' },
            release          : `ebot@${ Pkg.version }`,
            environment      : { $env : 'NODE_ENV' },
            tracesSampleRate : { $env : 'SENTRY_TRACE_SAMPLE_RATE', $coerce : 'number', $default : 1.0 }
        },
        cacheWarmup     : {
            guilds : { $env : 'EBOT_CACHE_WARMUP_GUILDS', $coerce : 'array', $default : [] },
            users  : { $env : 'EBOT_CACHE_WARMUP_USERS', $coerce : 'array', $default : [] }
        },
        disabledModules : { $env : 'EBOT_DISABLED_MODULES', $coerce : 'array', $default : [] },
        module          : {
            knex      : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'CORE_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'CORE_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'CORE_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'CORE_POSTGRES_DB', $default : 'core' },
                    port     : { $env : 'CORE_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            },
            upload    : {
                region       : { $env : 'UPLOAD_REGION' },
                bucket       : { $env : 'UPLOAD_BUCKET' },
                endpoint     : { $env : 'UPLOAD_ENDPOINT' },
                proto        : { $env : 'UPLOAD_PROTO', $default : 'https' },
                storageClass : { $env : 'UPLOAD_STORAGE_CLASS', $default : 'ONEZONE_IA' },
                credentials  : {
                    accessKeyId     : { $env : 'UPLOAD_ACCESS_KEY' },
                    secretAccessKey : { $env : 'UPLOAD_SECRET_KEY' }
                }
            },
            puppeteer : {
                path : { $env : 'CHROMIUM_PATH', $default : undefined }
            }
        }
    },
    modules : {
        ai       : {
            openai : {
                organization : { $env : 'OPENAI_ORGANIZATION' },
                apiKey       : { $env : 'OPENAI_API_KEY' }
            }
        },
        karma    : {
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
        mimic    : {
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
        history  : {
            knex : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'HISTORY_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'HISTORY_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'HISTORY_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'HISTORY_POSTGRES_DB', $default : 'history' },
                    port     : { $env : 'HISTORY_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            }
        },
        weather  : {
            openWeatherApiKey : { $env : 'OPEN_WEATHER_API_KEY' },
            LocationIQApiKey  : { $env : 'LOCATION_IQ_API_KEY' },
            knex              : {
                client     : 'pg',
                connection : {
                    host     : { $env : 'WEATHER_POSTGRES_HOST', $default : knexDefault.host },
                    user     : { $env : 'WEATHER_POSTGRES_USER', $default : knexDefault.user },
                    password : { $env : 'WEATHER_POSTGRES_PASS', $default : knexDefault.password },
                    database : { $env : 'WEATHER_POSTGRES_DB', $default : 'weather' },
                    port     : { $env : 'WEATHER_POSTGRES_PORT', $coerce : 'number', $default : knexDefault.port }
                }
            }
        },
        tools    : {
            googleImages   : {
                apiKey   : { $env : 'GOOGLE_CSE_API_KEY' },
                engineId : { $env : 'GOOGLE_CSE_ENGINE_ID' }
            },
            isThereAnyDeal : {
                apiKey : { $env : 'IS_THERE_ANY_DEAL_API_KEY' }
            }
        },
        currency : {
            freeCurrencyApi : {
                apiKey : { $env : 'FREE_CURRENCY_API_KEY' }
            }
        }
    }
});

module.exports = store.get('/');
