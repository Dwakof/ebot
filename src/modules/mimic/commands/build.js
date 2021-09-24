'use strict';

const { Command } = require('../../../core');

module.exports = class BuildCommand extends Command {

    constructor(commandHandler) {

        super('buildMimic', {
            aliases     : ['rebuildMimic'],
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
                    default   : (message) => message.guild
                }
            ],
            description : {
                content     : ' messages history with discord',
                usage       : 'buildMimic [guild]',
                examples    : ['buildMimic', 'rebuildMimic'],
                permissions : commandHandler.client.util.ownerIds()
            }
        });
    }

    async exec(message, { guild }) {

        const { State }        = this.client.providers('mimic');
        const { BuildService } = this.client.services('mimic');

        const status = await State.get('guild_rebuild', guild.id, { doing : false });

        if (status.doing) {

            return message.channel.send(`Already rebuilding this guild, see ${ status.url }`);
        }

        BuildService.build(guild.id, message);
    }
};
