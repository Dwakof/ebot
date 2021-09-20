'use strict';

exports.CoreEvents = {
    SENTRY_INITIALIZED : 'sentryInitialized',

    INVITE_LINK : 'inviteLink',

    PROVIDER_REGISTERED  : 'providerRegistered',
    PROVIDER_INITIALIZED : 'providerInitialized',

    SERVICE_REGISTERED  : 'serviceRegistered',
    SERVICE_INITIALIZED : 'serviceInitialized',

    COMMAND_HANDLER_REGISTERED       : 'commandHandlerRegistered',
    SLASH_COMMAND_HANDLER_REGISTERED : 'slashCommandHandlerRegistered',
    INHIBITOR_HANDLER_REGISTERED     : 'inhibitorHandlerRegistered',
    LISTENER_HANDLER_REGISTERED      : 'listenerHandlerRegistered',

    COMMAND_HANDLER_LOADED       : 'commandHandlerLoaded',
    SLASH_COMMAND_HANDLER_LOADED : 'slashCommandHandlerLoaded',
    INHIBITOR_HANDLER_LOADED     : 'inhibitorHandlerLoaded',
    LISTENER_HANDLER_LOADED      : 'listenerHandlerLoaded',

    MODULE_ERROR  : 'moduleError',
    MODULE_LOADED : 'moduleLoaded',

    CACHE_WARMUP_STARTED  : 'cacheWarmupStarted',
    CACHE_WARMUP_FINISHED : 'cacheWarmupFinished',

    GUILD_SLASH_COMMAND_BUILT       : 'guildSlashCommandBuilt',
    GUILD_SLASH_COMMANDS_REGISTERED : 'guildSlashCommandRegistered',

    GLOBAL_SLASH_COMMAND_BUILT       : 'globalSlashCommandBuilt',
    GLOBAL_SLASH_COMMANDS_REGISTERED : 'globalSlashCommandRegistered'
};
