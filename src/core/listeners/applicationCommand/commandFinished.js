'use strict';

const { Listener, ApplicationCommandHandler } = require('../../');

module.exports = class CommandFinishedListener extends Listener {

    constructor() {

        super(ApplicationCommandHandler.Events.COMMAND_FINISHED, { category : 'core', emitter : 'handler' });
    }

    exec(interaction, command) {

        this.client.logger.info({
            msg         : `ApplicationCommand "${ command.categoryID }.${ command.id }" was triggered by user "${ interaction?.user?.username }" in guild "${ interaction?.member?.guild?.name }" in channel "${ interaction?.channel?.name }"`,
            event       : this.event,
            emitter     : this.emitter,
            command     : {
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
