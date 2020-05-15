'use strict';

exports.CoreEvents = {
    SENTRY_INITIALIZED : 'sentryInitialized',

    PLUGIN_REGISTERED : 'pluginRegistered',
    PLUGIN_LOADED     : 'pluginLoaded',

    COMMAND_HANDLER_REGISTERED   : 'commandHandlerRegistered',
    INHIBITOR_HANDLER_REGISTERED : 'inhibitorHandlerRegistered',

    LISTENER_HANDLER_REGISTERED : 'listenerHandlerRegistered',
    COMMAND_HANDLER_LOADED      : 'commandHandlerLoaded',

    INHIBITOR_HANDLER_LOADED : 'inhibitorHandlerLoaded',
    LISTENER_HANDLER_LOADED  : 'listenerHandlerLoaded'
};
