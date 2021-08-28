'use strict';

const { Permissions } = require('discord.js');
const { Command }     = require('discord-akairo');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

class InfoCommand extends Command {

    constructor() {

        super('info', {
            aliases           : ['statistics', 'stats', 'stat', 'info'],
            description       : {
                content : 'Get informations on the bot',
                usage   : 'info'
            },
            category          : 'tools',
            clientPermissions : [Permissions.FLAGS.EMBED_LINKS, Permissions.FLAGS.SEND_MESSAGES],
            ratelimit         : 2
        });
    }

    exec(message, args) {

        const totalCommands = this.handler.categories.array().flatMap((cat) => cat.array()).length;

        const embed = this.client.util.embed()
            .setAuthor('Statistics of Ebot', this.client.user.avatarURL({ dynamic : true }))
            .addField('Version', this.client.settings.version, true)
            .addField('Memory', `${ (process.memoryUsage().rss / 1024 / 1024).toFixed(2) } MB`, true)
            .addField('Uptime', DayJS.duration(this.client.uptime).humanize(false), true)
            .addField('Commands', totalCommands.toString(), true)
            .addField('Admins', this.client.settings.discord.ownerId.map((id) => `<@${ id }>`).join(', '), true)
            .setFooter(`Asked by ${ message.author.username }`)
            .setTimestamp();

        return message.util.send(embed);
    }
}

module.exports = InfoCommand;
