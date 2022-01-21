'use strict';

const DayJS = require('dayjs');

const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

const { ApplicationCommand } = require('../../../core');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

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
            .addField('Uptime', DayJS.duration(this.client.uptime).humanize(false), true)
            .addField('Commands', totalCommands.toString(), true)
            .addField('Admins', this.client.util.ownerIds(), true)
            .setFooter(`Asked by ${ interaction.user.username }`)
            .setTimestamp();

        return interaction.reply({ embeds : [embed] });
    }
}

module.exports = InfoCommand;
