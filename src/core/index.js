/* eslint-disable padding-line-between-statements */
'use strict';

module.exports.Client = require('./client');

module.exports.Module  = require('./struct/module');
module.exports.Service = require('./struct/service');

module.exports.CommandHandler      = require('./struct/command/commandHandler');
module.exports.ListenerHandler     = require('./struct/listener/listenerHandler');
module.exports.SlashCommandHandler = require('./struct/slashCommand/slashCommandHandler');

module.exports.Command      = require('./struct/command/command');
module.exports.Listener     = require('./struct/listener/listener');
module.exports.SlashCommand = require('./struct/slashCommand/slashCommand');

module.exports.Util = require('./util');

module.exports.Constants = require('./constants');

module.exports.KeyvProvider = require('./struct/providers/keyv');
module.exports.ObjectionProvider = require('./struct/providers/objection');
