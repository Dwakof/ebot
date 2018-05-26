'use strict';

const Path                   = require('path');
const { RiMarkov, RiString } = require('rita');

const regex = {
    url       : /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/,
    discordAt : /[<@!>]/,
    emoji     : /:[^:\s]*(?:::[^:\s]*)*:/
};


module.exports = {
    name     : 'mimic',
    register : async (client, settings) => {

        client.rita = {};

        client.rita.model = new RiMarkov(5);

        client.registry.registerGroup('mimic', 'Mimic');

        client.registry.registerCommandsIn(Path.join(__dirname, 'commands'));

        client.on('message', (message) => {

            // Ignore private message
            if (message.channel.type === 'dm') {
                return;
            }

            // Ignore own message and bot
            if (message.author.id === client.user.id || message.author.bot) {
                return;
            }

            // Ignore commands
            if (client.dispatcher.parseMessage(message)) {
                return;
            }

            const string = new RiString(message.content);

            string.replaceAll(regex.discordAt, ' ');
            string.replaceAll(regex.emoji, ' ');
            string.replaceAll(regex.url, ' ');

            client.rita.model.loadText(string.text());
        });
    }
};
