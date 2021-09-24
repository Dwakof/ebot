'use strict';

const { Command } = require('../../../core');

module.exports = class SyncCommand extends Command {

    constructor(commandHandler) {

        super('sync', {
            aliases     : ['sync'],
            category    : 'history',
            channel     : 'guild',
            ownerOnly   : true,
            editable    : false,
            handleEdits : true,
            commandUtil : true,
            args        : [
                {
                    id        : 'guild',
                    type      : 'guild',
                    default   : (message) => message.guild,
                    unordered : true
                },
                {
                    id        : 'channel',
                    type      : 'channel',
                    default   : null,
                    unordered : true
                }
            ],
            description : {
                content     : 'Sync messages history with discord',
                usage       : 'sync [guild] [channel]',
                examples    : ['sync', 'sync #general'],
                permissions : commandHandler.client.util.ownerIds()
            }
        });
    }

    async exec(message, { guild, channel }) {

        const { State }       = this.client.providers('history');
        const { SyncService } = this.client.services('history');

        const guildStatus = await State.get('guild_import', guild.id, { doing : false });

        if (guildStatus.doing) {

            return message.channel.send(`Already syncing this guild, see ${ guildStatus.url }`);
        }

        if (channel) {

            if (!channel.isText()) {

                return message.channel.send('This channel could not be sync as it is not a text channel');
            }

            const channelStatus = await State.get('channel_import', channel.id, { doing : false });

            if (channelStatus.doing) {

                return message.channel.send(`Already syncing this channel, see ${ channelStatus.url }`);
            }

            SyncService.syncChannelFromMessage(guild.id, channel.id, message);

            return;
        }

        SyncService.syncGuildFromMessage(guild.id, message);
    }
};
