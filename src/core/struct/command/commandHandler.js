'use strict';

const { CommandHandler : AkairoCommandHandler, Constants } = require('discord-akairo');

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

    static get Events() {

        return Constants.CommandHandlerEvents;
    }

    async runCommand(message, command, args) {

        try {

            await this.client.sentry.startSpan({
                op       : `command`,
                name     : `[${ this.client.util.capitalize(command.categoryID) }] ${ command.id }`,
                metadata : {
                    method : 'COMMAND'
                }
            }, async () => {

                const scope = this.client.sentry.getCurrentScope();

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

                await super.runCommand(message, command, args);
            });
        }
        catch (error) {

            this.client.handleError(command, error, message);
        }
    }
};
