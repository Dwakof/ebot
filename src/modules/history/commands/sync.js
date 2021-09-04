'use strict';

const { Command } = require('discord-akairo');

const Sync = require('../utils/sync');

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
                    id      : 'channel',
                    type    : 'channel',
                    default : null
                }
            ],
            description : {
                content     : 'Sync messages history with discord',
                usage       : 'sync [channel]',
                examples    : ['sync', 'sync #general'],
                permissions : commandHandler.client.util.ownerIds()
            }
        });
    }

    async exec(message, { channel }) {

        const guildId = message.guild.id;

        const { State } = this.client.providers('history');

        const guildStatus = await State.get('guild_import', guildId, { doing : false });

        if (guildStatus.doing) {

            return message.channel.send(`Already syncing this guild, see ${ guildStatus.url }`);
        }

        if (channel) {

            if (!channel.isText()) {

                return message.channel.send('This channel could not be sync as it is not a text channel');
            }

            const channelStatus = await State.get('channel_import', channel.id, { doing : false });

            if (channelStatus.doing) {

                return message.channel.send(`Already syncing this guild, see ${ guildStatus.url }`);
            }

            Sync.syncChannel(this.client, channel.id, message);
        }

        Sync.syncGuild(this.client, guildId, message);
    }
};
