'use strict';

const { Listener, InteractionHandler } = require('../../');

module.exports = class InteractionFinishedListener extends Listener {

    constructor() {

        super(InteractionHandler.Events.INTERACTION_FINISHED, { category : 'core', emitter : 'handler' });
    }

    exec(interaction, interactionClass) {

        this.client.logger.info({
            msg         : `Interaction "${ interaction.customId }" was triggered by user "${ interaction?.user?.username }" in guild "${ interaction?.member?.guild?.name }" in channel "${ interaction?.channel?.name }"`,
            event       : this.event,
            emitter     : this.emitter,
            interaction : {
                id          : interaction.customId,
                class       : interactionClass.id,
                category    : interactionClass.categoryID,
                channelName : interaction?.channel?.name,
                authorName  : interaction?.user?.username,
                guildName   : interaction?.member?.guild?.name,
                content     : interaction.toString()
            }
        });
    }
};
