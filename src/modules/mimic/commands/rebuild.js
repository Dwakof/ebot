'use strict';

const { Command } = require('../../../core');

module.exports = class RebuildCommand extends Command {

    constructor(commandHandler) {

        super('rebuild', {
            aliases     : ['build'],
            category    : 'mimic',
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
                    id        : 'member',
                    type      : 'member',
                    default   : null,
                    unordered : true
                }
            ],
            description : {
                content     : ' messages history with discord',
                usage       : 'sync [guild] [channel]',
                examples    : ['sync', 'sync #general'],
                permissions : commandHandler.client.util.ownerIds()
            }
        });
    }

    async exec(message, { guild, member }) {

        const { State }       = this.client.providers('mimic');
        const { MimicService } = this.client.services('mimic');

        const guildStatus = await State.get('guild_rebuild', guild.id, { doing : false });

        if (guildStatus.doing) {

            return message.channel.send(`Already rebuilding this guild, see ${ guildStatus.url }`);
        }

        if (member) {

            const stateKey = `${ guild.id }_${ member.id }`;

            const userStatus = await State.get('user_rebuild', stateKey, { doing : false });

            if (userStatus.doing) {

                return message.channel.send(`Already rebuilding this user, see ${ userStatus.url }`);
            }

            MimicService.rebuildUser(guild, member, message);

            return;
        }

        MimicService.rebuildGuild(guild, message);
    }
};
