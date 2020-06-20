'use strict';

const { Command }     = require('discord-akairo');
const { Permissions } = require('discord.js');

module.exports = class AddReactionRoleCommand extends Command {

    constructor() {

        super('add reaction role', {
            aliases           : ['add reactionRole', 'addReactionRole', 'add reaction role'],
            userPermissions   : [Permissions.FLAGS.ADMINISTRATOR],
            clientPermissions : [Permissions.FLAGS.MANAGE_MESSAGES],
            channel           : 'guild',
            editable          : true,
            args              : [
                {
                    id     : 'role',
                    type   : 'role',
                    prompt : {
                        start : 'which role you want to link ?'
                    }
                },
                {
                    id     : 'channel',
                    type   : 'channel',
                    prompt : {
                        start : 'which channel you want to link ?'
                    }
                },
                {
                    id     : 'listeningChannels',
                    type   : 'channels', // TODO Need a custom type to allow an "everywhere" options
                    prompt : {
                        infinite   : true,
                        cancelWord : 'cancel',
                        stopWord   : 'stop',
                        start      : [
                            'which channel to listent to for this link ?',
                            'Type them in separate messages.',
                            'Type `stop` when you are done.'
                        ]
                    }
                }
            ]
        });
    }

    exec(message, { role, channel, listeningChannels }) {

        // TODO

        return message.reply('ok');
    }
};

