'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember } = require('discord.js');

const { View } = require('../../../core');

module.exports = class UserOverviewView extends View {

    /**
     * @param {Guild}                                   guild
     * @param {User|GuildMember}                        [user]
     * @param {Array<{ time : Date, value : Number }>}  stats
     * @param {Object}                                  options
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async render(guild, user, { count, topChannelId, messageAverage }, options = {}) {

        let { color } = options;

        if (user.displayColor !== 0) {

            color = color ?? user.displayHexColor;
        }

        if (!color) {

            color = '#404EED';
        }

        const embed = this.client.util.embed()
            .setTitle(`Stats for ${ user.username }`)
            .setThumbnail(user.avatarURL({ dynamic : true, size : 128 }))
            .setColor(color);

        embed.addField('Messages', `${ stats.reduce((acc, { value }) => acc + value, 0) }`, false);

        const { ChartService } = this.client.services('chart');

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
                        data            : stats.map(({ time, value }) => ({ x : time.getTime(), y : value }))
                    }
                ]
            },
            options : {
                plugins : { legend : { display : false } },
                scales  : ChartService.basicTimeSeriesScales()
            }
        });

        embed.setImage('attachment://chart.png');

        return { embeds : [embed], files : [this.client.util.attachment(buffer, 'chart.png')] };
    }
};
