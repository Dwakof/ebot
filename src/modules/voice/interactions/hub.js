'use strict';

const { MessageMentions : { ChannelsPattern }, channelMention } = require('discord.js');

const { Interaction, Util } = require('../../../core');

class Hub extends Interaction {

    constructor() {

        super('hub', { category : 'voice' });
    }

    static get interactions() {

        return {
            editDefaultSize : { method : 'editDefaultSize', customId : 'voice:hub:edit_default_size' },
            editDefaultType : { method : 'editDefaultType', customId : 'voice:hub:edit_default_type' },

            setDefaultSize : { method : 'setDefaultSize', customId : 'voice:hub:set_default_size' },
            setDefaultType : { method : 'setDefaultType', customId : 'voice:hub:set_default_type' }
        };
    }

    /**
     * @param {import('discord.js').MessageComponentInteraction}     interaction
     * @param {function(hub : Hub) : Promise<Hub|null>}              handler
     */
    async handle(interaction, handler) {

        const { HubService } = this.services();

        if (!interaction.guildId) {

            return null;
        }

        const hubId = interaction.message.content.match(ChannelsPattern)?.groups?.id;

        if (!hubId) {

            return;
        }

        let hub = await HubService.getHub(interaction.guildId, hubId);

        if (!hub) {

            return;
        }

        hub = await handler(hub);

        if (hub) {

            await HubService.update(hub);
            setTimeout(() => interaction.deleteReply(), Util.SECOND * 5);
        }
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editDefaultSize(interaction) {

        const { HubView } = this.views();

        return this.handle(interaction, async (hub) => {

            await interaction.reply(HubView.editDefaultSize(hub));
        });
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editDefaultType(interaction) {

        const { HubView } = this.views();

        return this.handle(interaction, async (hub) => {

            await interaction.reply(HubView.editDefaultType(hub));
        });
    }

    /** ***************************************************************************** **/

    /**
     * @param {import('discord.js').MentionableSelectMenuInteraction} interaction
     **/
    setDefaultSize(interaction) {

        return this.handle(interaction, async (hub) => {

            hub.config.defaultSize = parseInt(interaction.values.pop(), 10);

            if (isNaN(hub.config.defaultSize)) {

                await interaction.reply({ content : `Invalid default size ❌`, ephemeral : true });

                return;
            }

            await interaction.reply({ content : `Changed default size for ${ channelMention(hub.channel.id) } ✅`, ephemeral : true });

            return hub;
        });
    }

    /**
     * @param {import('discord.js').SelectMenuInteraction} interaction
     **/
    setDefaultType(interaction) {

        return this.handle(interaction, async (hub) => {

            hub.config.defaultType = interaction.values.pop();

            await interaction.reply({ content : `Changed default size for ${ channelMention(hub.channel.id) } ✅`, ephemeral : true });

            return hub;
        });
    }
}

module.exports = Hub;
