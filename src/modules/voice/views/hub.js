'use strict';

const { StringSelectMenuBuilder, ActionRowBuilder, channelMention, ButtonBuilder, ButtonStyle } = require('discord.js');

const { View }   = require('../../../core');

const { interactions } = require('../interactions/hub');

class HubView extends View {

    /**
     * @param {Hub} hub
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editHub(hub) {

        return {
            ephemeral  : true,
            content    : `Editing hub ${ channelMention(hub.channel.id) }`,
            components : [
                new ActionRowBuilder()
                    .addComponents([
                        new StringSelectMenuBuilder()
                            .setCustomId(interactions.setDefaultType.customId)
                            .setPlaceholder('Channel default visibility')
                            .setMinValues(1).setMaxValues(1)
                            .setOptions([
                                { label : 'Public', value : 'public', emoji : { name : '📢' }, default : hub.config.defaultType === 'public' },
                                { label : 'Inherit', value : 'inherit', emoji : { name : '📂' }, default : hub.config.defaultType === 'inherit' },
                                { label : 'Locked', value : 'locked', emoji : { name : '🔒' }, default : hub.config.defaultType === 'locked' },
                                { label : 'Private', value : 'private', emoji : { name : '🥷' }, default : hub.config.defaultType === 'private' }
                            ])
                    ]),
                new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(interactions.editDefaultSize.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Edit channel default size')
                            .setEmoji({ name : '🔢' })
                    ])
            ]
        };
    }

    /**
     * @param {Hub} hub
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editDefaultSize({ config, channel }) {

        return {
            ephemeral  : true,
            content    : `Choose a new default size for ${ channelMention(channel.id) }`,
            components : [
                new ActionRowBuilder()
                    .addComponents([
                        new StringSelectMenuBuilder()
                            .setCustomId(interactions.setDefaultSize.customId)
                            .setMinValues(1).setMaxValues(1)
                            .setPlaceholder('Choose a user limit')
                            .addOptions([
                                { label : 'Unlimited', value : '0', default : config.defaultSize === 0 },
                                ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]
                                    .map((value) => ({
                                        label   : String(value),
                                        value   : String(value),
                                        default : config.defaultSize === value
                                    }))
                            ])
                    ])
            ]
        };
    }
}

module.exports = HubView;
