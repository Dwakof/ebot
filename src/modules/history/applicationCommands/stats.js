'use strict';

const { ApplicationCommand, Util } = require('../../../core');

module.exports = class Stats extends ApplicationCommand {

    constructor() {

        super('stats', { category : 'history', description : 'Get stats for an user or the guild' });
    }

    static get subcommands() {

        return {
            user    : {
                method      : 'overviewUser',
                description : 'Get statistics for an user (default yourself)',
                options     : {
                    user : {
                        type        : ApplicationCommand.SubTypes.Member,
                        description : 'User to get statistic for',
                        required    : false
                    }
                }
            },
            channel : {
                method      : 'overviewChannel',
                description : 'Get statistic for an channel (default current channel)',
                options     : {
                    channel : {
                        type        : ApplicationCommand.SubTypes.Channel,
                        description : 'Channel to get statistic for',
                        required    : false
                    }
                }
            },
            guild   : {
                method      : 'overviewGuild',
                description : 'Get statistic for the entire guild'
            }
        };
    }

    async _message({ guild, user, channel }) {

        const { StatsService }        = this.client.services('history');
        const { MessageOverviewView } = this.client.views('history');

        const filter = { guildId : guild.id };

        if (user) {

            filter.authorId = user.id;

            const stats = await Util.PromiseProps({
                countMessageOverTime       : StatsService.countMessageOverTime(filter),
                rankOfUserForMessage       : StatsService.rankOfUserForMessage(filter),
                firstAndLastMessages       : StatsService.firstAndLastMessages(filter),
                rankingChannelsPerMessages : StatsService.rankingChannelsPerMessages({ ...filter, limit : 6 })
            });

            return MessageOverviewView.user(user, stats);
        }

        if (channel) {

            filter.channelId = channel.id;

            const stats = await Util.PromiseProps({
                countMessageOverTime    : StatsService.countMessageOverTime(filter),
                firstAndLastMessages    : StatsService.firstAndLastMessages(filter),
                rankingUsersPerMessages : StatsService.rankingUsersPerMessages({ ...filter, limit : 6 })
            });

            return MessageOverviewView.channel(channel, stats);
        }

        const stats = await Util.PromiseProps({
            countMessageOverTime       : StatsService.countMessageOverTime(filter),
            firstAndLastMessages       : StatsService.firstAndLastMessages(filter),
            rankingUsersPerMessages    : StatsService.rankingUsersPerMessages({ ...filter, limit : 6 }),
            rankingChannelsPerMessages : StatsService.rankingChannelsPerMessages({ ...filter, limit : 6 })
        });

        return MessageOverviewView.guild(guild, stats);
    }

    async _daily({ guild, user, channel }) {

        const { StatsService }      = this.client.services('history');
        const { DailyActivityView } = this.client.views('history');

        const filter = { guildId : guild.id };

        if (user) {

            filter.authorId = user.id;

            const stats = await Util.PromiseProps({
                dailyActivity           : StatsService.dailyActivity(filter),
                averageMessagePerPeriod : StatsService.averageMessagePerPeriod({ ...filter, period : 'day' }),
                mostActivePeriod        : StatsService.mostActivePeriod({ ...filter, period : 'day' })
            });

            return DailyActivityView.user(user, stats);
        }

        if (channel) {

            filter.channelId = channel.id;
        }

        const stats = await Util.PromiseProps({
            dailyActivity           : StatsService.dailyActivity(filter),
            averageMessagePerPeriod : StatsService.averageMessagePerPeriod({ ...filter, period : 'day' }),
            mostActivePeriod        : StatsService.mostActivePeriod({ ...filter, period : 'day' })
        });

        if (channel) {

            return DailyActivityView.channel(channel, stats);
        }

        return DailyActivityView.guild(guild, stats);
    }

    async _weekly({ guild, user, channel }) {

        const { StatsService }       = this.client.services('history');
        const { WeeklyActivityView } = this.client.views('history');

        const filter = { guildId : guild.id };

        if (user) {

            filter.authorId = user.id;

            const stats = await Util.PromiseProps({
                weeklyActivity          : StatsService.weeklyActivity(filter),
                averageMessagePerPeriod : StatsService.averageMessagePerPeriod({ ...filter, period : 'week' }),
                mostActivePeriod        : StatsService.mostActivePeriod({ ...filter, period : 'week' })
            });

            return WeeklyActivityView.user(user, stats);
        }

        if (channel) {

            filter.channelId = channel.id;
        }

        const stats = await Util.PromiseProps({
            weeklyActivity          : StatsService.weeklyActivity(filter),
            averageMessagePerPeriod : StatsService.averageMessagePerPeriod({ ...filter, period : 'week' }),
            mostActivePeriod        : StatsService.mostActivePeriod({ ...filter, period : 'week' })
        });

        if (channel) {

            return WeeklyActivityView.channel(channel, stats);
        }

        return WeeklyActivityView.guild(guild, stats);
    }

    async _reaction({ guild, user, channel }) {

        const { StatsService }         = this.client.services('history');
        const { ReactionOverviewView } = this.client.views('history');

        const filter = { guildId : guild.id };

        if (user) {

            filter.authorId = user.id;

            const stats = await Util.PromiseProps({
                mostReactedMessage         : StatsService.mostReactedMessage(filter),
                mostUsedReactionEmoji      : StatsService.mostUsedReactionEmoji(filter),
                mostReceivedReactionEmoji  : StatsService.mostReceivedReactionEmoji(filter),
                countReceivedReactionEmoji : StatsService.countReceivedReactionEmoji(filter),
                countGivenReactionEmoji    : StatsService.countGivenReactionEmoji(filter)
            });

            return ReactionOverviewView.user(user, stats);
        }

        if (channel) {

            filter.channelId = channel.id;
        }

        const stats = await Util.PromiseProps({
            mostReactedMessage           : StatsService.mostReactedMessage(filter),
            mostUsedReactionEmoji        : StatsService.mostUsedReactionEmoji({ limit : 12, ...filter }),
            topUserReceivedReactionEmoji : StatsService.topUserReceivedReactionEmoji(filter),
            topUserGivenReactionEmoji    : StatsService.topUserGivenReactionEmoji(filter),
            countGivenReactionEmoji      : StatsService.countGivenReactionEmoji(filter)
        });

        if (channel) {

            return ReactionOverviewView.channel(channel, stats);
        }

        return ReactionOverviewView.guild(guild, stats);
    }

    async _emoji({ guild, user, channel }) {

        const { StatsService }      = this.client.services('history');
        const { EmojiOverviewView } = this.client.views('history');

        const filter = { guildId : guild.id };

        if (user) {

            filter.authorId = user.id;

            const stats = await Util.PromiseProps({
                mostUsedEmoji                  : StatsService.mostUsedEmoji(filter),
                rankOfUserForEmoji             : StatsService.rankOfUserForEmoji(filter),
                averageEmojiPerPeriod          : StatsService.averageEmojiPerPeriod({ ...filter, period : 'day' }),
                averageEmojiPerMessageOverTime : StatsService.averageEmojiPerMessageOverTime(filter)
            });

            return EmojiOverviewView.user(user, stats);
        }

        if (channel) {

            filter.channelId = channel.id;

            const stats = await Util.PromiseProps({
                mostUsedEmoji                  : StatsService.mostUsedEmoji(filter),
                countUsedEmoji                 : StatsService.countUsedEmoji(filter),
                averageEmojiPerMessageOverTime : StatsService.averageEmojiPerMessageOverTime(filter),
                rankingUsersPerEmoji           : StatsService.rankingUsersPerEmoji({ ...filter, limit : 6 })
            });

            return EmojiOverviewView.channel(channel, stats);
        }

        const stats = await Util.PromiseProps({
            mostUsedEmoji                  : StatsService.mostUsedEmoji(filter),
            countUsedEmoji                 : StatsService.countUsedEmoji(filter),
            averageEmojiPerMessageOverTime : StatsService.averageEmojiPerMessageOverTime(filter),
            rankingUsersPerEmoji           : StatsService.rankingUsersPerEmoji({ ...filter, limit : 6 })
        });

        return EmojiOverviewView.guild(guild, stats);
    }

    async overviewUser(interaction, { user }) {

        const guild = interaction.guild;

        if (!user) {

            user = interaction.user;
        }

        user = await user.fetch(true);

        return new Util.DashboardPaginatedEmbeds(interaction, [
            { id : 'message', label : 'Messages', embed : this._message({ guild, user }) },
            { id : 'reaction', label : 'Reactions', embed : this._reaction({ guild, user }) },
            { id : 'weekly', label : 'Weekly', embed : this._weekly({ guild, user }) },
            { id : 'daily', label : 'Daily', embed : this._daily({ guild, user }) },
            { id : 'emoji', label : 'Emoji', embed : this._emoji({ guild, user }) }
        ]).send();
    }

    overviewChannel(interaction, { channel }) {

        const guild = interaction.guild;

        if (!channel) {

            channel = interaction.channel;
        }

        return new Util.DashboardPaginatedEmbeds(interaction, [
            { id : 'message', label : 'Messages', embed : this._message({ guild, channel }) },
            { id : 'reaction', label : 'Reactions', embed : this._reaction({ guild, channel }) },
            { id : 'weekly', label : 'Weekly', embed : this._weekly({ guild, channel }) },
            { id : 'daily', label : 'Daily', embed : this._daily({ guild, channel }) },
            { id : 'emoji', label : 'Emoji', embed : this._emoji({ guild, channel }) }
        ]).send();
    }

    overviewGuild(interaction) {

        const guild = interaction.guild;

        return new Util.DashboardPaginatedEmbeds(interaction, [
            { id : 'message', label : 'Messages', embed : this._message({ guild }) },
            { id : 'reaction', label : 'Reactions', embed : this._reaction({ guild }) },
            { id : 'weekly', label : 'Weekly', embed : this._weekly({ guild }) },
            { id : 'daily', label : 'Daily', embed : this._daily({ guild }) },
            { id : 'emoji', label : 'Emoji', embed : this._emoji({ guild }) }
        ]).send();
    }
};
