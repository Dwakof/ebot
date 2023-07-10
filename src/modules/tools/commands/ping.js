'use strict';

const { Colors } = require('discord.js');

const { Command } = require('../../../core');

class PingCommand extends Command {

    constructor() {

        super('ping', { aliases : ['ping'] });
    }

    async exec(message, args) {

        const embed = this.client.util.embed().setTitle('Pong!');

        const sent = await message.util.send({ embeds : [embed] });

        const timeDiff = (sent.editedAt || sent.createdAt) - (message.editedAt || message.createdAt);

        embed.setTimestamp()
            .setColor(Colors.Green)
            .addFields([
                { name : '🔂 **RTT**', value : `${ timeDiff } ms`, inline : true },
                { name : '💟 **Heartbeat**', value : `${ Math.round(this.client.ws.ping) } ms`, inline : true }
            ]);

        if (timeDiff > 80 || this.client.ws.ping > 80) {

            embed.setColor(Colors.Yellow);
        }

        if (timeDiff > 100 || this.client.ws.ping > 100) {

            embed.setColor(Colors.Red);
        }

        return message.util.send({ embeds : [embed] });
    }
}

module.exports = PingCommand;
