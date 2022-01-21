'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember, TextChannel } = require('discord.js');
const { hyperlink, userMention, inlineCode }                                     = require('@discordjs/builders');

const { View, Util } = require('../../../core');

const displayEmoji = (emoji) => {

    return emoji.indexOf(':') !== -1 ? `<${ emoji }>` : emoji;
};

module.exports = class ReactionOverviewView extends View {

    /**
     * @param {Guild}  guild
     * @param {Object} stats
     *
     * @return {Promise<{embeds: MessageEmbed[]}>}
     */
    async guild(guild, stats) {

        const embed = this.embed().setTitle(`Reaction overview for ${ guild.name }`);

        this.guildThumbnail(embed, guild);

        this.totalReactions(embed, stats);
        this.topReactionsGlobal(embed, stats);
        this.topUser(embed, stats);

        if (stats.mostReactedMessage) {

            const { attachment } = await this.mostReactedMessage(embed, stats);

            return { embeds : [embed], files : [attachment] };
        }

        return { embeds : [embed] };
    }

    /**
     * @param {TextChannel} channel
     * @param {Object}      stats
     *
     * @return {Promise<{embeds: MessageEmbed[]}>}
     */
    async channel(channel, stats) {

        const embed = this.embed().setTitle(`Reaction overview for channel #${ channel.name }`);

        this.guildThumbnail(embed, channel.guild);

        this.totalReactions(embed, stats);
        this.topReactionsGlobal(embed, stats);
        this.topUser(embed, stats);

        if (stats.mostReactedMessage) {

            const { attachment } = await this.mostReactedMessage(embed, stats);

            return { embeds : [embed], files : [attachment] };
        }

        return { embeds : [embed] };
    }

    /**
     * @param {GuildMember|User} user
     * @param {Object}           stats
     *
     * @return {Promise<{embeds: MessageEmbed[]}>}
     */
    async user(user, stats) {

        const embed = this.embed().setTitle(`Reaction overview for ${ user.username }`);

        this.userThumbnail(embed, user);

        this.totalReactions(embed, stats);
        this.topReactions(embed, stats);

        if (stats.mostReactedMessage) {

            const { attachment } = await this.mostReactedMessage(embed, stats);

            return { embeds : [embed], files : [attachment] };
        }

        return { embeds : [embed] };
    }

    totalReactions(embed, stats) {

        const { countReceivedReactionEmoji, countGivenReactionEmoji } = stats;

        embed.addField('Given reactions', `${ this.client.util.code(countGivenReactionEmoji) }`, true);
        embed.addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        if (countReceivedReactionEmoji) {

            embed.addField('Received reactions', `${ this.client.util.code(countReceivedReactionEmoji) }`, true);
        }
        else {

            embed.addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);
        }

        return embed;
    }

    topReactions(embed, stats) {

        const { CommonView } = this.views();

        const { mostUsedReactionEmoji, mostReceivedReactionEmoji } = stats;

        CommonView.multiColumnSingleField(embed, mostUsedReactionEmoji, 'Top given reaction', {
            callback : (value, column) => {

                return inlineCode(`${ Util.padLeftString(value.count, Util.max(column, ({ count }) => count)) } x `) + CommonView.displayEmoji(value.emoji);
            }
        });

        embed.addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        CommonView.multiColumnSingleField(embed, mostReceivedReactionEmoji, 'Top received reaction', {
            callback : (value, column) => {

                return inlineCode(`${ Util.padLeftString(value.count, Util.max(column, ({ count }) => count)) } x `) + CommonView.displayEmoji(value.emoji);
            }
        });

        return embed;
    }

    topReactionsGlobal(embed, stats) {

        const { CommonView } = this.views();

        const { mostUsedReactionEmoji } = stats;

        return CommonView.multiColumnSingleFullWidthField(embed, mostUsedReactionEmoji, 'Top given reaction', {
            callback({ count, emoji }, column) {

                return inlineCode(`${ Util.padLeftString(count, Util.max(column, (v) => v?.count || 0)) } x `) + displayEmoji(emoji);
            }
        });
    }

    topUser(embed, stats) {

        const { CommonView } = this.views();

        const { topUserReceivedReactionEmoji, topUserGivenReactionEmoji } = stats;

        CommonView.multiColumnSingleField(embed, topUserGivenReactionEmoji, 'Top reactions', {
            column   : 1,
            callback : ({ count, authorId }, column, i, j) => {

                return `${ this.rank(j + 1) } ${ inlineCode(`${ Util.padLeftString(count, Util.max(column, (v) => v?.count || 0)) }`) } ${ userMention(authorId) }`;
            }
        });

        CommonView.multiColumnSingleField(embed, topUserReceivedReactionEmoji, 'Top reacted', {
            column   : 1,
            callback : ({ count, authorId }, column, i, j) => {

                return `${ this.rank(j + 1) } ${ inlineCode(`${ Util.padLeftString(count, Util.max(column, (v) => v?.count || 0)) }`) } ${ userMention(authorId) }`;
            }
        });

        return embed;
    }

    /**
     * @param {MessageEmbed} embed
     * @param stats
     * @return {Promise<{attachment: MessageAttachment, embed : MessageEmbed}>}
     */
    async mostReactedMessage(embed, stats) {

        const { mostReactedMessage : { messageId, channelId, guildId } } = stats;

        embed.addField('Most reacted message', hyperlink('<link message>', Util.linkUrl({ guildId, channelId, messageId })), false);

        const { ScreenshotService } = this.services('tools');

        const buffer = await ScreenshotService.screenshotMessageId(messageId, channelId);

        const attachment = this.client.util.attachment(buffer, `${ messageId }.png`);

        embed.setImage('attachment://' + attachment.name);

        return { embed, attachment };
    }
};
