'use strict';

const { Listener, ApplicationCommandHandler } = require('../../');

module.exports = class CommandFinishedListener extends Listener {

    constructor() {

        super(ApplicationCommandHandler.Events.COMMAND_FINISHED, {
            category : 'core',
            emitter  : 'handler',
            event    : ApplicationCommandHandler.Events.COMMAND_FINISHED
        });
    }

    exec(interaction, command) {

        this.client.logger.info({
            event   : this.event,
            emitter : this.emitter,
            command : {
                id       : command.id,
                category : command.categoryID
            },
            interaction : {
                id          : interaction.id,
                channelName : interaction?.channel?.name,
                authorName  : interaction?.user?.username,
                guildName   : interaction?.member?.guild?.name,
                content     : interaction.toString()
            }
        });
    }
};
