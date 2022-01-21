'use strict';

const { Permissions } = require('discord.js');

const { Command } = require('../../../core');

module.exports = class EyeMouthEyeCommand extends Command {

    constructor() {

        super('eme', {
            aliases           : ['eyemoutheye', 'eme'],
            clientPermissions : [Permissions.FLAGS.SEND_MESSAGES],
            args              : [],
            description       : {
                content  : '👁👄👁',
                usage    : 'eme',
                examples : ['eme']
            }
        });
    }

    async exec(message, args) {

        await message.channel.send(`👁👄👁`);
    }
};
