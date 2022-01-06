'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed, MessageAttachment, Guild, User, GuildMember } = require('discord.js');

const { View } = require('../../../core');

module.exports = class WeeklyActivityView extends View {

    /**
     * @param {Guild}            guild
     * @param {User|GuildMember} [user]
     * @param stats
     * @param {Object}           options
     *
     * @return {Promise<{files: MessageAttachment[], embeds: MessageEmbed[]}>}
     */
    async render(guild, user, { heatmap, average }, options = {}) {

        const { scale = 'Discord' } = options;

        const embed = this.client.util.embed()
            .setTitle(`Weekly Stats for ${ guild.name }`)
            .setThumbnail(guild.iconURL({ dynamic : true, size : 128 }));

        if (user) {

            embed.setTitle(`Weekly Stats for ${ user.username }`)
                .setThumbnail(user.avatarURL({ dynamic : true, size : 128 }));
        }

        const { HeatmapView } = this.client.views('chart');

        const days  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const hours = Array.from(Array(24).keys()).map((hour) => `${ hour }h`.padStart(3, '0'));

        const data = heatmap.map(({ hour, day, value }) => ({ x : hours[hour], y : days[day === 0 ? 6 : day - 1], value }));

        embed.setColor(this.client.util.color.scale(scale)(1).hex);

        const { image, attachment } = await HeatmapView.render(hours, days, data, { scale });

        embed.setImage(image);

        return { embeds : [embed], files : [attachment] };
    }
};
