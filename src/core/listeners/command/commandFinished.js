'use strict';

const { Listener, CommandHandler } = require('../../');

module.exports = class CommandFinishedListener extends Listener {

    constructor() {

        super(CommandHandler.Events.COMMAND_FINISHED, { category : 'core', emitter : 'handler' });
    }

    exec(message, command, params, reply) {

        this.client.logger.info({
            msg     : `Command "${ command.categoryID }${ command.id }" was triggered by user "${ message?.author?.username }" in guild "${ message?.guild?.name }"`,
            event   : this.event,
            emitter : this.emitter,
            params,
            command : {
                id       : command.id,
                category : command.categoryID
            },
            message : {
                id          : message.id,
                channelName : message?.channel?.name,
                authorName  : message?.author?.username,
                guildName   : message?.guild?.name,
                content     : message?.content
            }
        });
    }
};
