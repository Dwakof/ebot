'use strict';

const { Command }   = require('discord-akairo');
const { Constants } = require('discord.js');

class PingCommand extends Command {

    constructor() {

        super('ping', {
            aliases : ['ping']
        });
    }

    async exec(message, args) {

        const embed = this.client.util.embed()
            .setTitle('Pong!');

        const sent = await message.util.send(embed);

        const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);

        embed.addField(':repeat_one: **RTT**', `${ timeDiff } ms`, true)
            .addField(':heart_decoration: **Heartbeat**', `${ Math.round(this.client.ws.ping) } ms`, true)
            .setTimestamp();

        embed.setColor(Constants.Colors.GREEN);

        if (timeDiff > 80 || this.client.ws.ping > 80) {

            embed.setColor(Constants.Colors.YELLOW);
        }

        if (timeDiff > 100 || this.client.ws.ping > 100) {

            embed.setColor(Constants.Colors.RED);
        }

        return message.util.send(embed);
    }
}

module.exports = PingCommand;
