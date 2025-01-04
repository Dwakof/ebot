'use strict';

const { ActionRowBuilder, ButtonBuilder, UserSelectMenuBuilder, MentionableSelectMenuBuilder, StringSelectMenuBuilder, ButtonStyle } = require('discord.js');
const { userMention, inlineCode, roleMention }                                                                                 = require('discord.js');

const { View, Util } = require('../../../core');

const { interactions } = require('../interactions/control');

class ControlView extends View {

    /**
     * @param {Map<import('discord.js').Snowflake, { id : import('discord.js').Snowflake, type : 'role'|'user' }>} list
     * @returns {String}
     */
    mentionableList(list = new Map()) {

        if (!list.size) {

            return inlineCode('Empty');
        }

        return Array.from(list).map(([, { type, id }]) => {

            switch (type) {
                case 'user':
                    return userMention(id);
                case 'role':
                    return roleMention(id);
            }

        }).join('\n');
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    controlMessage({ channel, owner, config }) {

        const embed = this.embed()
            .setColor(owner.displayHexColor)
            .setAuthor({ iconURL : owner.user.displayAvatarURL(), name : `Temporary channel control interface` })
            .addFields([
                { name : '📢 Public', value : 'Channel is open for everyone to join except blacklisted members', inline : true },
                { name : '📂 Inherit', value : 'Channel inherit default permission from the category plus allow whitelisted members and block blacklisted members', inline : true },
                { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true },
                { name : '🔒 Locked', value : 'Channel is visible to everyone except blacklisted members, only whitelisted members can join', inline : true },
                { name : '🥷 Private', value : 'Channel is hidden, only whitelisted members can see it and join', inline : true },
                { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true },
                { name : `👑 Owner :`, value : userMention(owner.user.id), inline : true },
                { name : `🌎 Region :`, value : inlineCode(channel.rtcRegion ?? 'Automatic'), inline : true },
                { name : `🔢 Limit :`, value : inlineCode(channel.userLimit || '∞'), inline : true },
                { name : `✅ Whitelist :`, value : this.mentionableList(config.whitelist), inline : true },
                { name : `⛔ Blacklist :`, value : this.mentionableList(config.blacklist), inline : true }
            ]);

        return {
            embeds     : [embed],
            components : [
                new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(interactions.setPublic.customId)
                            .setStyle(config.type === 'public' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(config.type === 'public')
                            .setLabel('Public')
                            .setEmoji({ name : '📢' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.setInherit.customId)
                            .setStyle(config.type === 'inherit' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(config.type === 'inherit')
                            .setLabel('Inherit')
                            .setEmoji({ name : '📂' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.setLocked.customId)
                            .setStyle(config.type === 'locked' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(config.type === 'locked')
                            .setLabel('Locked')
                            .setEmoji({ name : '🔒' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.setPrivate.customId)
                            .setStyle(config.type === 'private' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                            .setDisabled(config.type === 'private')
                            .setLabel('Private')
                            .setEmoji({ name : '🥷' })
                    ]),
                new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(interactions.editWhitelist.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Edit Whitelist')
                            .setEmoji({ name : '✅' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.editBlacklist.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Edit Blacklist')
                            .setEmoji({ name : '⛔' })
                    ]),
                new ActionRowBuilder()
                    .addComponents([
                        new ButtonBuilder()
                            .setCustomId(interactions.editOwnership.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Transfer ownership')
                            .setEmoji({ name : '👑' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.editRegion.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Change region')
                            .setEmoji({ name : '🌎' }),
                        new ButtonBuilder()
                            .setCustomId(interactions.editUserLimit.customId)
                            .setStyle(ButtonStyle.Secondary)
                            .setLabel('Edit user limit')
                            .setEmoji({ name : '🔢' })
                    ])
            ]
        };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editWhitelist({ config }) {

        const select = new MentionableSelectMenuBuilder()
            .setCustomId(interactions.setWhitelist.customId)
            .setMinValues(0).setMaxValues(25)
            .setPlaceholder('Select a user or role');

        for (const [, { type, id }] of (config.whitelist ?? /** @type {TemporaryChannel['config']['whitelist']} */ new Map())) {

            switch (type) {

                case 'user': {

                    select.addDefaultUsers([id]);
                    break;
                }

                case 'role': {

                    select.addDefaultRoles([id]);
                    break;
                }
            }
        }

        return {
            ephemeral  : true,
            content    : `Who do you want to add to the whitelist ?`,
            components : [new ActionRowBuilder().addComponents([select])]
        };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editBlacklist({ config }) {

        const select = new MentionableSelectMenuBuilder()
            .setCustomId(interactions.setBlacklist.customId)
            .setMinValues(0).setMaxValues(25)
            .setPlaceholder('Select a user or role');

        for (const [, { type, id }] of (config.blacklist ?? /** @type {TemporaryChannel['config']['blacklist']} */ new Map())) {

            switch (type) {

                case 'user': {

                    select.addDefaultUsers([id]);
                    break;
                }

                case 'role': {

                    select.addDefaultRoles([id]);
                    break;
                }
            }
        }

        return {
            ephemeral  : true,
            content    : `Who do you want to add to the blacklist ?`,
            components : [new ActionRowBuilder().addComponents([select])]
        };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editOwnership({ owner }) {

        return {
            ephemeral  : true,
            content    : `Who do you want to transfer ownership to ?`,
            components : [
                new ActionRowBuilder()
                    .addComponents([
                        new UserSelectMenuBuilder()
                            .setCustomId(interactions.setOwnership.customId)
                            .setMinValues(1).setMaxValues(1)
                            .setPlaceholder('Select a user')
                            .setDefaultUsers([owner.user.id])
                    ])
            ]
        };
    }

    /**
     * @param {TemporaryChannel}                                                          temporaryChannel
     * @param {import('discord.js').Collection<string, import('discord.js').VoiceRegion>} regions
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editRegion({ channel, owner, config }, regions) {

        const select = new StringSelectMenuBuilder()
            .setCustomId(interactions.setRegion.customId)
            .setMinValues(1).setMaxValues(1)
            .setPlaceholder('Select a region');

        select.addOptions([{ label : 'Automatic', value : '!automatic!', default : channel.rtcRegion === null }]);

        for (const [, region] of regions) {

            const _default = region.id === channel.rtcRegion;

            if (!region.deprecated || _default) {

                select.addOptions([{ label : region.name, value : region.id, default : _default }]);
            }
        }

        return {
            ephemeral  : true,
            content    : `Select a region for the channel`,
            components : [new ActionRowBuilder().addComponents([select])]
        };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     *
     * @return {import('discord.js').MessageCreateOptions}
     */
    editUserLimit({ channel }) {

        return {
            ephemeral  : true,
            content    : `Choose a new user limit`,
            components : [
                new ActionRowBuilder()
                    .addComponents([
                        new StringSelectMenuBuilder()
                            .setCustomId(interactions.setUserLimit.customId)
                            .setMinValues(1).setMaxValues(1)
                            .setPlaceholder('Choose a user limit')
                            .addOptions([
                                { label : 'Unlimited', value : '0', default : channel.userLimit === 0 },
                                ...[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30]
                                    .map((value) => ({
                                        label   : String(value),
                                        value   : String(value),
                                        default : channel.userLimit === value
                                    }))
                            ])
                    ])
            ]
        };
    }
}

module.exports = ControlView;
