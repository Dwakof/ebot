'use strict';

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, TextChannel, Guild, User, GuildMember } = require('discord.js');

const { channelMention, userMention, time : Time, inlineCode } = require('discord.js');

const { View, Util } = require('../../../core');

module.exports = class MessageOverviewView extends View {

    /**
     * @param {Guild}  guild
     * @param {Object} stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Messages activity for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.total(embed, stats);
        this.firstAndLastMessages(embed, stats);
        this.topChannel(embed, stats);
        this.topUser(embed, stats);

        await this.chartOverTime(embed, stats);

        return embed;
    }

    /**
     * @param {TextChannel} channel
     * @param {Object}      stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Message activity for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.total(embed, stats);
        this.firstAndLastMessages(embed, stats);
        this.topUser(embed, stats);

        await this.chartOverTime(embed, stats);

        return embed;
    }

    /**
     * @param {GuildMember|User} user
     * @param {Object}           stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Message activity for ${ user.username }`);

        this.userThumbnail(embed, user);
        this.infoUser(embed, stats);
        this.firstAndLastMessages(embed, stats);
        this.topChannel(embed, stats);

        await this.chartOverTime(embed, stats);

        return embed;
    }

    total(embed, stats) {

        const { countMessageOverTime } = stats;

        const total = Util.sum(countMessageOverTime, ({ value }) => value);

        embed.addFields([
            { name : 'Total messages', value : inlineCode(total), inline : true },
            { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true },
            { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true }
        ]);

        return embed;
    }

    infoUser(embed, stats) {

        const { rankOfUserForMessage : { count, rank } } = stats;

        embed.addFields([
            { name : 'Total messages', value : count, inline : true },
            { name : 'Rank', value : Util.RANK_LIST[parseInt(rank) - 1] || Util.ordinal(parseInt(rank)), inline : true },
            { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true }
        ]);

        return embed;
    }

    firstAndLastMessages(embed, stats) {

        const { firstAndLastMessages : { first, last } } = stats;

        embed.addFields([
            { name : 'First message', value : Time(first.createdAt, 'R'), inline : true },
            { name : 'Last message', value : Time(last.createdAt, 'R'), inline : true },
            { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true }
        ]);

        return embed;
    }

    topChannel(embed, stats) {

        const { rankingChannelsPerMessages } = stats;

        if (!rankingChannelsPerMessages) {

            return;
        }

        return this.twoColumnEmptyThird(embed, rankingChannelsPerMessages, 'Top channels', {
            callback : ({ count, rank, total, channelId }, column) => {

                return [
                    this.rank(rank, total), ' ',
                    inlineCode(Util.padLeftString(count, Util.max(column, (v) => v?.count || 0))),
                    channelMention(channelId)
                ].join('');
            }
        });
    }

    topUser(embed, stats) {

        const { rankingUsersPerMessages } = stats;

        if (!rankingUsersPerMessages) {

            return;
        }

        return this.twoColumnEmptyThird(embed, rankingUsersPerMessages, 'Top users', {
            callback : ({ count, rank, total, authorId }, column) => {

                return [
                    this.rank(rank, total), ' ',
                    inlineCode(Util.padLeftString(count, Util.max(column, (v) => v?.count || 0))),
                    userMention(authorId)
                ].join('');
            }
        });
    }

    async chartOverTime(embed, stats) {

        const { ChartService } = this.services('core');

        const { countMessageOverTime } = stats;

        const url = await ChartService.renderAndUpload({
            width   : 1200,
            height  : 600,
            type    : 'bar',
            data    : {
                datasets : [
                    {
                        label           : 'messages',
                        backgroundColor : Util.embedHexColor(embed),
                        borderRadius    : 30,
                        borderWidth     : 0,
                        parsing         : false,
                        normalized      : true,
                        data            : countMessageOverTime.map(({ time, value }) => ({ x : time.getTime(), y : value }))
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : ChartService.basicTimeSeriesScales()
            }
        });

        embed.setImage(url);

        embed.addFields([{ name : 'Message over time', value : Util.BLANK_CHAR, inline : false }]);

        return embed;
    }
};
