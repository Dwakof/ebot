'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class Stats extends ApplicationCommand {

    constructor() {

        super('stats', { category : 'history', description : 'Get stats for an user or the guild' });
    }

    static get subgroups() {

        return {
            daily   : {
                description : 'Get an average hourly activity for an user or the guild',
                subcommands : {
                    user  : {
                        method      : 'hourly',
                        description : 'Get an average hourly activity for an user, by default yourself',
                        options     : {
                            user : {
                                type        : ApplicationCommand.SubTypes.Member,
                                description : 'User to get stats for',
                                required    : false
                            }
                        }
                    },
                    guild : {
                        method      : 'hourly',
                        description : 'Get an average hourly activity for the guild'
                    }
                }
            },
            weekly  : {
                description : 'Get an average daily activity for an user or the guild',
                subcommands : {
                    user  : {
                        method      : 'weekly',
                        description : 'Get an average daily activity for an user, by default yourself',
                        options     : {
                            user : {
                                type        : ApplicationCommand.SubTypes.Member,
                                description : 'User to get stats for',
                                required    : false
                            }
                        }
                    },
                    guild : {
                        method      : 'weekly',
                        description : 'Get an average daily activity for the guild'
                    }
                }
            },
            message : {
                description : 'Get an historical message count for an user or the guild',
                subcommands : {
                    user  : {
                        method      : 'count',
                        description : 'Get an historical message count for an user, by default yourself',
                        options     : {
                            user : {
                                type        : ApplicationCommand.SubTypes.Member,
                                description : 'User to get stats for',
                                required    : false
                            }
                        }
                    },
                    guild : {
                        method      : 'count',
                        description : 'Get an historical message count for the guild'
                    }
                }
            }
        };
    }

    async count(interaction, { user }) {

        const { StatsService } = this.client.services('history');

        await interaction.deferReply();

        if (user) {

            user = await user.fetch(true);
        }

        const stats = await StatsService.getCountMessageOverTime({ guildId : interaction.guild.id, authorId : user?.id });

        const message = await StatsService.getCountMessageOverTimeView(stats, { guild : interaction.guild, user });

        return this.client.util.send(interaction, message);
    }

    async hourly(interaction, { user }) {

        const { StatsService } = this.client.services('history');

        await interaction.deferReply();

        if (user) {

            user = await user.fetch(true);
        }

        const stats = await StatsService.getHourlyActivity({ guildId : interaction.guild.id, authorId : user?.id });

        const message = await StatsService.getHourlyActivityView(stats, { guild : interaction.guild, user });

        return this.client.util.send(interaction, message);
    }

    async weekly(interaction, { user }) {

        const { StatsService }       = this.client.services('history');
        const { WeeklyActivityView } = this.client.views('history');

        await interaction.deferReply();

        if (user) {

            user = await user.fetch(true);
        }

        const [heatmap, average] = await Promise.all([
            StatsService.getWeeklyActivity({ guildId : interaction.guild.id, authorId : user?.id }),
            StatsService.getAverageMessagePerPeriod({ guildId : interaction.guild.id, authorId : user?.id, period : 'week' })
        ]);

        return this.client.util.send(interaction, await WeeklyActivityView.render(interaction.guild, user, { heatmap, average }));
    }
};
