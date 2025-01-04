'use strict';

const { inlineCode, userMention, PermissionsBitField } = require('discord.js');

const { Interaction, Util } = require('../../../core');

class Control extends Interaction {

    constructor() {

        super('control', { category : 'voice' });
    }

    static get interactions() {

        return {
            setPublic  : { method : 'setPublic', customId : 'voice:control:set_public' },
            setInherit : { method : 'setInherit', customId : 'voice:control:set_inherit' },
            setLocked  : { method : 'setLocked', customId : 'voice:control:set_locked' },
            setPrivate : { method : 'setPrivate', customId : 'voice:control:set_private' },

            editWhitelist : { method : 'editWhitelist', customId : 'voice:control:edit_whitelist' },
            editBlacklist : { method : 'editBlacklist', customId : 'voice:control:edit_blacklist' },
            editOwnership : { method : 'editOwnership', customId : 'voice:control:edit_ownership' },
            editUserLimit : { method : 'editUserLimit', customId : 'voice:control:edit_user_limit' },
            editRegion    : { method : 'editRegion', customId : 'voice:control:edit_region' },

            setWhitelist : { method : 'setWhitelist', customId : 'voice:control:set_whitelist' },
            setBlacklist : { method : 'setBlacklist', customId : 'voice:control:set_blacklist' },
            setOwnership : { method : 'setOwnership', customId : 'voice:control:set_ownership' },
            setUserLimit : { method : 'setUserLimit', customId : 'voice:control:set_user_limit' },
            setRegion    : { method : 'setRegion', customId : 'voice:control:set_region' }
        };
    }

    /**
     * @param {import('discord.js').MessageComponentInteraction}                      interaction
     * @param {function(channel : TemporaryChannel) : Promise<TemporaryChannel|null>} handler
     */
    async handle(interaction, handler) {

        const { ControlView }             = this.views();
        const { TemporaryChannelService } = this.services();

        if (!interaction.guildId) {

            return null;
        }

        let channel = await TemporaryChannelService.getTemporaryChannel(interaction.guildId, interaction.channelId);

        if (!channel) {

            return;
        }

        if (interaction.user.id !== channel.owner.id) {

            await interaction.reply({ content : 'You are not the owner of this channel.', ephemeral : true });

            return;
        }

        channel = await handler(channel);

        if (channel) {

            await Promise.all([
                TemporaryChannelService.update(channel),
                (async () => {

                    if (interaction?.message?.id === channel.config.messageId) {

                        return interaction.message.edit(ControlView.controlMessage(channel));
                    }

                    const message = await channel.channel.messages.fetch(channel.config.messageId);

                    await message.edit(ControlView.controlMessage(channel));

                    setTimeout(() => interaction.deleteReply(), Util.SECOND * 5);
                })()
            ]);
        }
    }

    /**
     * @param {import('discord.js').MessageComponentInteraction} interaction
     * @param {TemporaryChannel['config']['type']}               type
     */
    changeType(interaction, type) {

        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            channel.config.type = type;

            await TemporaryChannelService.updatePermission(channel);
            await interaction.reply({ content : `Channel set to ${ inlineCode(type) }`, ephemeral : true });

            setTimeout(() => interaction.deleteReply(), Util.SECOND * 5);

            return channel;
        });
    }

    /** ***************************************************************************** **/

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    setPublic(interaction) {

        return this.changeType(interaction, 'public');
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    setInherit(interaction) {

        return this.changeType(interaction, 'inherit');
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    setLocked(interaction) {

        return this.changeType(interaction, 'locked');
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    setPrivate(interaction) {

        return this.changeType(interaction, 'private');
    }

    /** ***************************************************************************** **/

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editWhitelist(interaction) {

        const { ControlView } = this.views();

        return this.handle(interaction, async (channel) => {

            await interaction.reply(ControlView.editWhitelist(channel));
        });
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editBlacklist(interaction) {

        const { ControlView } = this.views();

        return this.handle(interaction, async (channel) => {

            await interaction.reply(ControlView.editBlacklist(channel));
        });
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editOwnership(interaction) {

        const { ControlView } = this.views();

        return this.handle(interaction, async (channel) => {

            await interaction.reply(ControlView.editOwnership(channel));
        });
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editUserLimit(interaction) {

        const { ControlView } = this.views();

        return this.handle(interaction, async (channel) => {

            await interaction.reply(ControlView.editUserLimit(channel));
        });
    }

    /**
     * @param {import('discord.js').ButtonInteraction} interaction
     **/
    editRegion(interaction) {

        const { ControlView }             = this.views();
        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            await interaction.reply(ControlView.editRegion(channel, await TemporaryChannelService.getRegions()));
        });
    }

    /** ***************************************************************************** **/

    /**
     * @param {import('discord.js').MentionableSelectMenuInteraction} interaction
     **/
    setWhitelist(interaction) {

        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            await interaction.reply({ content : `Changing Whitelist...`, ephemeral : true });

            channel.config.whitelist = new Map();

            for (const id of interaction.roles.keys()) {

                channel.config.whitelist.set(id, { type : 'role', id });
                channel.config.blacklist.delete(id);
            }

            for (const id of interaction.users.keys()) {

                channel.config.whitelist.set(id, { type : 'user', id });
                channel.config.blacklist.delete(id);
            }

            await TemporaryChannelService.updatePermission(channel);
            await interaction.editReply({ content : `Changed Whitelist ✅` });

            return channel;
        });
    }

    /**
     * @param {import('discord.js').MentionableSelectMenuInteraction} interaction
     **/
    setBlacklist(interaction) {

        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            await interaction.reply({ content : `Changing Blacklist...`, ephemeral : true });

            channel.config.blacklist = new Map();

            for (const id of interaction.roles.keys()) {

                channel.config.blacklist.set(id, { type : 'role', id });
                channel.config.whitelist.delete(id);
            }

            for (const id of interaction.users.keys()) {

                if (id === channel.owner.id) {

                    await interaction.editReply({ content : `You cannot put yourself in the blacklist ❌` });
                    return;
                }

                channel.config.blacklist.set(id, { type : 'user', id });
                channel.config.whitelist.delete(id);
            }

            await TemporaryChannelService.updatePermission(channel);

            for (const member of channel.channel.members.values()) {

                if (!channel.channel.permissionsFor(member).has(PermissionsBitField.Flags.Connect, true)) {

                    await member.voice.disconnect('Owner of channel blacklisted this member');
                }
            }

            await interaction.editReply({ content : `Changed Blacklist ✅` });

            return channel;
        });
    }

    /**
     * @param {import('discord.js').UserSelectMenuInteraction} interaction
     **/
    setOwnership(interaction) {

        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            const owner = interaction.members.at(0);

            await interaction.reply({ content : `Changing ownership to ${ userMention(owner.user.id) }`, ephemeral : true });

            channel.owner          = await channel.channel.guild.members.fetch(owner.user.id);
            channel.config.ownerId = channel.owner.user.id;

            await Promise.all([
                TemporaryChannelService.updatePermission(channel),
                TemporaryChannelService.updateName(channel)
            ]);

            await interaction.editReply({ content : `Changed ownership to ${ userMention(owner.user.id) } ✅` });

            return channel;
        });
    }

    /**
     * @param {import('discord.js').SelectMenuInteraction} interaction
     **/
    setUserLimit(interaction) {

        return this.handle(interaction, async (channel) => {

            const userLimit = parseInt(interaction.values.pop(), 10);

            if (isNaN(userLimit)) {

                await interaction.reply({ content : `Invalid user limit ❌`, ephemeral : true });

                return;
            }

            await interaction.reply({ content : `Changing user limit to ${ inlineCode(String(userLimit || 'unlimited')) }`, ephemeral : true });

            channel.config.size = userLimit;

            await channel.channel.edit({ userLimit });

            await interaction.editReply({ content : `Changed user limit to ${ inlineCode(String(userLimit || 'unlimited')) } ✅` });

            return channel;
        });
    }

    /**
     * @param {import('discord.js').SelectMenuInteraction} interaction
     **/
    setRegion(interaction) {

        const { TemporaryChannelService } = this.services();

        return this.handle(interaction, async (channel) => {

            const regions = await TemporaryChannelService.getRegions();

            let regionId = interaction.values.pop();

            if (regionId === '!automatic!') {

                regionId = null;
            }

            await interaction.reply({ content : `Changing region to ${ inlineCode(regions.get(regionId)?.name ?? 'Automatic') }`, ephemeral : true });

            await channel.channel.setRTCRegion(regionId);

            await interaction.editReply({ content : `Changed region to ${ inlineCode(regions.get(regionId)?.name ?? 'Automatic') } ✅` });

            return channel;
        });
    }
}

module.exports = Control;
