'use strict';

const { CommandHandler : AkairoCommandHandler } = require('discord-akairo');

module.exports = class CommandHandler extends AkairoCommandHandler {

    async runCommand(message, command, args) {

        let transaction;

        try {

            if (this.client.sentry) {

                transaction = this.client.sentry.startTransaction({
                    op       : `command`,
                    name     : `[${ this.client.utils.capitalize(command.categoryID) }] ${ command.id }`,
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

                        scope.setContext('args', this.client.utils.serializeArgs(args));
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
