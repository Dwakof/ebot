'use strict';

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder, Guild, User, GuildMember, TextChannel } = require('discord.js');
const { userMention, inlineCode }                             = require('discord.js');

const { View, Util } = require('../../../core');

const displayEmoji = (emoji) => {

    return emoji.indexOf(':') !== -1 ? `<${ emoji }>` : emoji;
};

module.exports = class EmojiOverviewView extends View {

    /**
     * @param {Guild}  guild
     * @param {Object} stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Emoji overview for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.topEmojis(embed, stats);
        this.topUser(embed, stats);

        await this.averageOverTime(embed, stats);

        return embed;
    }

    /**
     * @param {TextChannel} channel
     * @param {Object}      stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Emoji overview for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.topEmojis(embed, stats);
        this.topUser(embed, stats);

        await this.averageOverTime(embed, stats);

        return embed;
    }

    /**
     * @param {GuildMember|User} user
     * @param {Object}           stats
     *
     * @return {Promise<EmbedBuilder>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Emoji overview for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.infoUser(embed, stats);
        this.topEmojis(embed, stats);

        await this.averageOverTime(embed, stats);

        return embed;
    }

    topEmojis(embed, stats) {

        const { CommonView } = this.views();

        const { mostUsedEmoji } = stats;

        return CommonView.multiColumnSingleFullWidthField(embed, mostUsedEmoji, 'Top used emoji', {
            callback({ count, emoji }, column) {

                return inlineCode(`${ Util.padLeftString(count, Util.max(column, (v) => v?.count || 0)) } x `) + displayEmoji(emoji);
            }
        });
    }

    topUser(embed, stats) {

        const { rankingUsersPerEmoji } = stats;

        if (!rankingUsersPerEmoji) {

            return;
        }

        return this.twoColumnSplitMiddle(embed, rankingUsersPerEmoji, 'Top users', {
            callback : ({ count, authorId, rank, total }, column) => {

                return [
                    this.rank(rank, total), ' ',
                    inlineCode(`${ Util.padLeftString(count, Util.max(column, (v) => v?.count || 0)) }`),
                    userMention(authorId)
                ].join('');
            }
        });
    }

    infoUser(embed, stats) {

        const { rankOfUserForEmoji } = stats;

        if (!rankOfUserForEmoji) {

            embed.addFields([
                { name : 'Total Emoji used', value : '0', inline : true },
                { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true },
                { name : 'Rank', value : 'unranked', inline : true }
            ]);

            return embed;
        }

        embed.addFields([
            { name : 'Total Emoji used', value : rankOfUserForEmoji.count, inline : true },
            { name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true },
            { name : 'Rank', value : Util.RANK_LIST[parseInt(rankOfUserForEmoji.rank) - 1] || Util.ordinal(parseInt(rankOfUserForEmoji.rank)), inline : true }
        ]);

        return embed;
    }

    async averageOverTime(embed, stats) {

        const { ChartService } = this.services('core');

        const { averageEmojiPerMessageOverTime } = stats;

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
                        data            : averageEmojiPerMessageOverTime.map(({ time, average }) => ({ x : time.getTime(), y : average * 100 }))
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : ChartService.basicTimeSeriesScales({
                    y : {
                        min   : 0,
                        ticks : {
                            callback : (value) => `${ value }%`
                        }
                    }
                })
            }
        });

        embed.setImage(url);

        embed.addFields([{ name : 'Percentage of emoji per message', value : Util.BLANK_CHAR, inline : false }]);

        return embed;
    }
};
