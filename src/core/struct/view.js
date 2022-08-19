'use strict';

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder } = require('discord.js');

const Util = require('../util');

class View {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @param {EbotClient} client
     * @param {String}     module
     */
    constructor(client, module) {

        this.client = client;
        this.module = module;
        this.id     = new.target.name;
    }

    /**
     * Method to override that is called when the client is started.
     */
    init(settings) {}

    /**
     * @param [data]
     *
     * @return {EmbedBuilder}
     */
    embed(data) {

        return this.client.util.embed(data).setColor('#404EED').setTimestamp();
    }

    guildThumbnail(embed, guild) {

        return embed.setThumbnail(guild.iconURL({ dynamic : true, size : 32 }));
    }

    userThumbnail(embed, user) {

        return embed.setThumbnail(user.displayAvatarURL({ dynamic : true, size : 32 }));
    }

    rank(rank, total) {

        if (total === rank) {

            return Util.POOP;
        }

        return Util.RANK_LIST[parseInt(rank) - 1] || Util.ordinal(parseInt(rank));
    }

    services(module = this.module) {

        return this.client.services(module);
    }

    views(module = this.module) {

        return this.client.views(module);
    }

    /**
     * @return {Module~Store}
     */
    get store() {

        return this.client.store(this.module);
    }

    multiColumnSingleFullWidthField(embed, values, title = 'Title', options = {}) {

        const { row = 3, column = 4, callback, emptyValueCallback = () => ''.padStart(4, Util.BLANK_CHAR_SPACE) } = options;

        const chunk = Util.chunk(values, row);

        const lines = [];

        for (let i = 0; i < row; ++i) {

            const cells = [];

            for (let j = 0; j < column; ++j) {

                const value = (chunk[j] || [])[i];

                if (!value) {

                    cells.push(emptyValueCallback());
                    continue;
                }

                cells.push(callback(value, chunk[j], column, row));
            }

            lines.push(cells.join(Util.BLANK_CHAR_SPACE + Util.BLANK_CHAR_SPACE));
        }

        embed.addFields([{ name : title, value : lines.join('\n'), inline : false }]);

        return embed;
    }

    multiColumnSingleField(embed, values, title = 'Title', options = {}) {

        const { row = 3, column = 2, callback, emptyValueCallback = () => ''.padStart(4, Util.BLANK_CHAR_SPACE) } = options;

        const chunk = Util.chunk(values, Math.ceil(values.length / column));

        const lines = [];

        for (let i = 0; i < row; ++i) {

            const cells = [];

            for (let j = 0; j < column; ++j) {

                const value = (chunk[j] || [])[i];

                if (!value) {

                    cells.push(emptyValueCallback());
                    continue;
                }

                cells.push(callback(value, chunk[j], j, i));
            }

            lines.push(cells.join(Util.BLANK_CHAR_SPACE + Util.BLANK_CHAR_SPACE));
        }

        embed.addFields([{ name : title, value : lines.join('\n') || Util.BLANK_CHAR, inline : true }]);

        return embed;
    }

    twoColumnSplitMiddle(embed, values, title = 'Title', options = {}) {

        const { callback } = options;

        const [columns1, columns2 = []] = Util.chunk(values, Math.ceil(values.length / 2));

        let lines = [];

        for (const [i, value] of columns1.entries()) {

            lines.push(callback(value, columns1, i, 0));
        }

        embed.addFields([{ name : title, value : lines.join('\n'), inline : true }]);

        this.emptyRow(embed);

        lines = [];

        for (const [i, value] of columns2.entries()) {

            lines.push(callback(value, columns2, i, 0));
        }

        embed.addFields([{ name : Util.BLANK_CHAR, value : lines.join('\n'), inline : true }]);

        return embed;
    }

    twoColumnEmptyThird(embed, values, title = 'Title', options = {}) {

        const { callback } = options;

        const [columns1, columns2 = []] = Util.chunk(values, Math.ceil(values.length / 2));

        let lines = [];

        for (const [i, value] of columns1.entries()) {

            lines.push(callback(value, columns1, i, 0));
        }

        embed.addFields([{ name : title, value : lines.join('\n'), inline : true }]);

        lines = [];

        for (const [i, value] of columns2.entries()) {

            lines.push(callback(value, columns2, i, 0));
        }

        embed.addFields([{ name : Util.BLANK_CHAR, value : lines.join('\n'), inline : true }]);
        this.emptyRow(embed);

        return embed;
    }

    emptyRow(embed) {

        return embed.addFields([{ name : Util.BLANK_CHAR, value : Util.BLANK_CHAR, inline : true }]);
    }
}

module.exports = View;
