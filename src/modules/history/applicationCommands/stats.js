'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class Stats extends ApplicationCommand {

    constructor() {

        super('stats', { category : 'history', description : 'Get stats for an user or the guild' });
    }

    static get subcommands() {

        return {
            user  : {
                method      : 'statsUser',
                description : 'Stats for an user',
                options     : {
                    user : {
                        type        : ApplicationCommand.SubTypes.Member,
                        description : 'User to get stats for',
                        required    : true
                    }
                }
            },
            guild : {
                method      : 'statsGuild',
                description : 'Stats for the guild',
                options     : {
                    guild : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Guild to get stats for',
                        required    : false
                    }
                }
            }
        };
    }

    async getStats(interaction, { guild, user }) {

        const { StatsService } = this.client.services('history');

        await interaction.deferReply();

        if (user) {

            user = await user.fetch(true);
        }

        const stats = await StatsService.getCountMessageOverTime({ guildId : guild.id, authorId : user?.id });

        const message = StatsService.getCountMessageOverTimeView(stats, { guild, user });

        return this.client.util.send(interaction, message);
    }

    statsUser(interaction, { user }) {

        return this.getStats(interaction, { guild : interaction.guild, user : user || interaction.user });
    }

    statsGuild(interaction, { guild }) {

        return this.getStats(interaction, { guild : guild || interaction.guild });
    }
};
