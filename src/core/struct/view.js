'use strict';

// eslint-disable-next-line no-unused-vars
const { MessageEmbed } = require('discord.js');

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
    init() {}

    /**
     * @param [data]
     *
     * @return {MessageEmbed}
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
}

module.exports = View;
