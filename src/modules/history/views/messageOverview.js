'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, TextChannel, Guild, User, GuildMember } = require('discord.js');

const { channelMention, userMention, time : Time, inlineCode } = require('@discordjs/builders');

const { View, Util } = require('../../../core');

module.exports = class MessageOverviewView extends View {

    /**
     * @param {Guild}  guild
     * @param {Object} stats
     *
     * @return {Promise<MessageEmbed>}
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
     * @return {Promise<MessageEmbed>}
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
     * @return {Promise<MessageEmbed>}
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

        embed.addField('Total messages', inlineCode(total), true)
            .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true)
            .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        return embed;
    }

    infoUser(embed, stats) {

        const { rankOfUserForMessage : { count, rank } } = stats;

        embed.addField('Total messages', count, true)
            .addField('Rank', Util.RANK_LIST[parseInt(rank) - 1] || Util.ordinal(parseInt(rank)), true)
            .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        return embed;
    }

    firstAndLastMessages(embed, stats) {

        const { firstAndLastMessages : { first, last } } = stats;

        embed.addField('First message', Time(first.createdAt, 'R'), true)
            .addField('Last message', Time(last.createdAt, 'R'), true)
            .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

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

        const { ChartService } = this.services('tooling');

        const { countMessageOverTime } = stats;

        const url = await ChartService.renderAndUpload({
            width   : 1200,
            height  : 600,
            type    : 'bar',
            data    : {
                datasets : [
                    {
                        label           : 'messages',
                        backgroundColor : embed.hexColor,
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

        embed.addField('Message over time', Util.BLANK_CHAR, false);

        return embed;
    }
};
