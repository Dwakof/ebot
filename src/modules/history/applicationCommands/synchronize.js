'use strict';

const { PermissionsBitField, ChannelType } = require('discord.js');

const { ApplicationCommand } = require('../../../core');

module.exports = class Synchronize extends ApplicationCommand {

    constructor() {

        super('synchronize', { description : 'Synchronize the message with the database' });
    }

    static get command() {

        return {
            method  : 'synchronize',
            options : {
                channel : {
                    type        : ApplicationCommand.SubTypes.Channel,
                    description : 'Channel to synchronize',
                    required    : false
                }
            }
        };
    }

    async synchronize(interaction, { channel }) {

        const { State }       = this.providers();
        const { SyncService } = this.services();

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {

            return interaction.reply({ content : `Only administrator can use this command`, ephemeral : true });
        }

        await interaction.deferReply();

        const guildStatus = await State.get('guild_import', interaction.guildId, { doing : false });

        if (guildStatus.doing) {

            return interaction.reply(`Already syncing this guild, see ${ guildStatus.url }`);
        }

        if (channel) {

            if (channel.type !== ChannelType.GuildText) {

                return interaction.reply('This channel could not be sync as it is not a text channel');
            }

            const channelStatus = await State.get('channel_import', channel.id, { doing : false });

            if (channelStatus.doing) {

                return interaction.reply(`Already syncing this channel, see ${ channelStatus.url }`);
            }

            SyncService.syncChannelFromMessage(interaction.guildId, channel.id, interaction);

            return;
        }

        SyncService.syncGuildFromMessage(interaction.guildId, interaction);
    }
};
