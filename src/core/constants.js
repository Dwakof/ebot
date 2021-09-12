'use strict';

exports.CoreEvents = {
    SENTRY_INITIALIZED : 'sentryInitialized',

    INVITE_LINK : 'inviteLink',

    PROVIDER_REGISTERED  : 'providerRegistered',
    PROVIDER_INITIALIZED : 'providerInitialized',

    SERVICE_REGISTERED  : 'serviceRegistered',
    SERVICE_INITIALIZED : 'serviceInitialized',

    COMMAND_HANDLER_REGISTERED   : 'commandHandlerRegistered',
    INHIBITOR_HANDLER_REGISTERED : 'inhibitorHandlerRegistered',

    LISTENER_HANDLER_REGISTERED : 'listenerHandlerRegistered',
    COMMAND_HANDLER_LOADED      : 'commandHandlerLoaded',

    INHIBITOR_HANDLER_LOADED : 'inhibitorHandlerLoaded',
    LISTENER_HANDLER_LOADED  : 'listenerHandlerLoaded',

    MODULE_ERROR  : 'moduleError',
    MODULE_LOADED : 'moduleLoaded',

    CACHE_WARMUP_STARTED  : 'cacheWarmupStarted',
    CACHE_WARMUP_FINISHED : 'cacheWarmupFinished',

    SLASH_COMMAND_BUILT       : 'slashCommandBuilt',
    SLASH_COMMANDS_REGISTERED : 'slashCommandRegistered'
};
