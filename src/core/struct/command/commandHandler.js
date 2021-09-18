'use strict';

const { CommandHandler : AkairoCommandHandler } = require('discord-akairo');

const CoreUtil = require('../../util');

/**
 * Loads commands and handles messages.
 *
 * @param {EbotClient} client - The Ebot client.
 * @param {CommandHandlerOptions} options - Options.
 *
 * @extends {AkairoCommandHandler}
 */
module.exports = class CommandHandler extends AkairoCommandHandler {

    /**
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     * @param {CommandHandlerOptions} options
     */
    constructor(client, options) {

        super(client, options);

        this.client = client;
    }

    async runCommand(message, command, args) {

        let transaction;

        try {

            if (this.client.sentry) {

                transaction = this.client.sentry.startTransaction({
                    op       : `command`,
                    name     : `[${ this.client.util.capitalize(command.categoryID) }] ${ command.id }`,
                    metadata : {
                        method : 'COMMAND'
                    }
                });

                this.client.sentry.configureScope((scope) => {

                    scope.setContext('message', {
                        id        : message.id,
                        channel   : message.channel.name,
                        channelId : message.channel.id,
                        guild     : message.guild.name,
                        guildId   : message.guild.id,
                        content   : message.cleanContent
                    });

                    if (Object.keys(args).length > 0) {

                        scope.setContext('args', CoreUtil.serializeArgs(args));
                    }

                    scope.setUser({
                        id       : message.author.id,
                        username : `${ message.author.username }#${ message.author.discriminator }`
                    });

                    if (transaction) {

                        scope.setSpan(transaction);
                    }
                });
            }

            await super.runCommand(message, command, args);

            if (transaction) {

                transaction.status = 'ok';
            }
        }
        catch (error) {

            if (transaction) {

                transaction.status = 'unknown';
            }

            this.client.handleError(command, error, message);
        }
        finally {

            if (transaction) {

                transaction.finish();
            }
        }
    }
};
