'use strict';

const { Permissions } = require('discord.js');

const { Command } = require('../../../core');

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
                    type   : 'channels',
                    prompt : {
                        infinite   : true,
                        cancelWord : 'cancel',
                        stopWord   : 'stop',
                        start      : [
                            'which channel to listen to for this link ?',
                            'Type them in separate messages.',
                            'Type `stop` when you are done (or `cancel` to abandon).'
                        ]
                    }
                }
            ]
        });
    }

    exec(message, { role, channel, listeningChannels }) {

        // TODO

        return message.reply('no no no, not working yet');
    }
};

