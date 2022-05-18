'use strict';

const { Duration } = require('luxon');

const { ApplicationCommand } = require('../../../core');

class InfoCommand extends ApplicationCommand {

    constructor() {

        super('info', {
            description : 'Get informations on the bot',
            global      : true
        });
    }

    static get command() {

        return { method : 'info', options : {} };
    }

    info(interaction) {

        const totalCommands = (Array.from(this.handler.categories.values())
            .flatMap((cat) => (Array.from(cat.values()).length)))
            .reduce((acc, x) => (acc + x), 0);

        const embed = this.client.util.embed()
            .setAuthor('Statistics of Ebot', this.client.user.avatarURL({ dynamic : true }))
            .addField('Version', this.client.settings.version, true)
            .addField('Memory', `${ (process.memoryUsage().rss / 1024 / 1024).toFixed(2) } MB`, true)
            .addField('Uptime', Duration.fromObject({ milliseconds : this.client.uptime }).toHuman(), true)
            .addField('Commands', totalCommands.toString(), true)
            .addField('Admins', this.client.util.ownerIds(), true)
            .setFooter(`Asked by ${ interaction.user.username }`)
            .setTimestamp();

        return interaction.reply({ embeds : [embed] });
    }
}

module.exports = InfoCommand;
