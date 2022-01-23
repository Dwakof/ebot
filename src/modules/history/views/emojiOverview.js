'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember, TextChannel } = require('discord.js');
const { userMention, inlineCode }                                                            = require('@discordjs/builders');

const { View, Util } = require('../../../core');

const displayEmoji = (emoji) => {

    return emoji.indexOf(':') !== -1 ? `<${ emoji }>` : emoji;
};

module.exports = class EmojiOverviewView extends View {

    /**
     * @param {Guild}  guild
     * @param {Object} stats
     *
     * @return {Promise<{embeds: MessageEmbed[], files: MessageAttachment[]}>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Emoji overview for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.topEmojis(embed, stats);
        this.topUser(embed, stats);

        const { attachment } = await this.averageOverTime(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {TextChannel} channel
     * @param {Object}      stats
     *
     * @return {Promise<{embeds: MessageEmbed[], files: MessageAttachment[]}>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Emoji overview for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.topEmojis(embed, stats);
        this.topUser(embed, stats);

        const { attachment } = await this.averageOverTime(embed, stats);

        return { embeds : [embed], files : [attachment] };
    }

    /**
     * @param {GuildMember|User} user
     * @param {Object}           stats
     *
     * @return {Promise<{embeds: MessageEmbed[], files: MessageAttachment[]}>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Emoji overview for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.infoUser(embed, stats);
        this.topEmojis(embed, stats);

        const { attachment } = await this.averageOverTime(embed, stats);

        return { embeds : [embed], files : [attachment] };
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

            embed.addField('Total Emoji used', '0', true)
                .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true)
                .addField('Rank', 'unranked', true);

            return embed;
        }

        embed.addField('Total Emoji used', rankOfUserForEmoji.count, true)
            .addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true)
            .addField('Rank', Util.RANK_LIST[parseInt(rankOfUserForEmoji.rank) - 1] || Util.ordinal(parseInt(rankOfUserForEmoji.rank)), true);

        return embed;
    }

    async averageOverTime(embed, stats) {

        const { ChartService } = this.services('tooling');

        const { averageEmojiPerMessageOverTime } = stats;

        const buffer = await ChartService.renderToBuffer({
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

        embed.setImage('attachment://chart.png');

        embed.addField('Percentage of emoji per message', Util.BLANK_CHAR, false);

        return { embed, attachment : this.client.util.attachment(buffer, 'chart.png') };
    }
};
