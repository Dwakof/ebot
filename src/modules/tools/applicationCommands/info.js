'use strict';

const { Duration } = require('luxon');

const { ApplicationCommand } = require('../../../core');

class InfoCommand extends ApplicationCommand {

    constructor() {

        super('info', { description : 'Get informations on the bot' });
    }

    static get command() {

        return { method : 'info', options : {} };
    }

    info(interaction) {

        const totalCommands = (Array.from(this.handler.categories.values())
            .flatMap((cat) => (Array.from(cat.values()).length)))
            .reduce((acc, x) => (acc + x), 0);

        const embed = this.client.util.embed()
            .setAuthor({ name : 'Statistics of Ebot', icon_url : this.client.user.avatarURL({ dynamic : true }) })
            .addFields([
                { name : 'Version', value : this.client.version, inline : true },
                { name : 'Memory', value : `${ (process.memoryUsage().rss / 1024 / 1024).toFixed(2) } MB`, inline : true },
                { name : 'Uptime', value : Duration.fromObject({ milliseconds : this.client.uptime }).toHuman(), inline : true },
                { name : 'Commands', value : totalCommands.toString(), inline : true },
                { name : 'Admins', value : this.client.util.ownerIds(), inline : true }
            ])
            .setFooter({ text : `Asked by ${ interaction.user.username }` })
            .setTimestamp();

        return interaction.reply({ embeds : [embed] });
    }
}

module.exports = InfoCommand;
