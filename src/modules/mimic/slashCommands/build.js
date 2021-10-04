'use strict';

const { SlashCommand } = require('../../../core');

module.exports = class Rebuild extends SlashCommand {

    constructor() {

        super('build-mimic', { category : 'mimic', description : `Build guild's models`, defaultPermission : false });
    }

    static get command() {

        return {
            method  : 'build',
            options : {
                guild : {
                    type        : SlashCommand.Types.String,
                    description : 'Guild ID to build',
                    required    : false
                }
            }
        };
    }

    permissions() {

        return [SlashCommand.Permission.OWNERS];
    }

    async build(interaction, { guild : guildId }) {

        const { State } = this.client.providers('mimic');

        const { BuildService } = this.client.services('mimic');

        if (!guildId) {

            guildId = interaction.guildId;
        }

        const status = await State.get('guild_rebuild', guildId, { doing : false });

        if (status.doing) {

            return this.client.util.send(interaction, `Already rebuilding this guild, see ${ status.url }`);
        }

        BuildService.build(guildId, interaction);
    }
};