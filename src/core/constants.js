'use strict';

exports.CoreEvents = {
    SENTRY_INITIALIZED : 'sentryInitialized',

    INVITE_LINK : 'inviteLink',

    PROVIDER_REGISTERED  : 'providerRegistered',
    PROVIDER_INITIALIZED : 'providerInitialized',

    SERVICE_REGISTERED  : 'serviceRegistered',
    SERVICE_INITIALIZED : 'serviceInitialized',

    VIEW_REGISTERED  : 'viewRegistered',
    VIEW_INITIALIZED : 'viewInitialized',

    COMMAND_HANDLER_REGISTERED             : 'commandHandlerRegistered',
    APPLICATION_COMMAND_HANDLER_REGISTERED : 'applicationCommandHandlerRegistered',
    INTERACTION_HANDLER_REGISTERED         : 'interactionHandlerRegistered',
    INHIBITOR_HANDLER_REGISTERED           : 'inhibitorHandlerRegistered',
    LISTENER_HANDLER_REGISTERED            : 'listenerHandlerRegistered',

    COMMAND_HANDLER_LOADED             : 'commandHandlerLoaded',
    APPLICATION_COMMAND_HANDLER_LOADED : 'applicationCommandHandlerLoaded',
    INTERACTION_HANDLER_LOADED         : 'interactionHandlerLoaded',
    INHIBITOR_HANDLER_LOADED           : 'inhibitorHandlerLoaded',
    LISTENER_HANDLER_LOADED            : 'listenerHandlerLoaded',

    MODULE_ERROR  : 'moduleError',
    MODULE_LOADED : 'moduleLoaded',

    CACHE_WARMUP_STARTED  : 'cacheWarmupStarted',
    CACHE_WARMUP_FINISHED : 'cacheWarmupFinished',

    GUILD_APPLICATION_COMMAND_BUILT       : 'guildApplicationCommandBuilt',
    GUILD_APPLICATION_COMMANDS_REGISTERED : 'guildApplicationCommandRegistered',

    GLOBAL_APPLICATION_COMMAND_BUILT       : 'globalApplicationCommandBuilt',
    GLOBAL_APPLICATION_COMMANDS_REGISTERED : 'globalApplicationCommandRegistered',

    SCHEDULE_CREATED      : 'scheduleCreated',
    SCHEDULE_STARTED      : 'scheduleStarted',
    SCHEDULE_ENDED        : 'scheduleEnded',
    SCHEDULE_FAILED       : 'scheduleFailed',
    CACHE_SEGMENT_CREATED : 'cacheSegmentCreated'
};
