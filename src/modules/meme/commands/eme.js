'use strict';

const { PermissionsBitField } = require('discord.js');

const { Command } = require('../../../core');

module.exports = class EyeMouthEyeCommand extends Command {

    constructor() {

        super('eme', {
            aliases           : ['eyemoutheye', 'eme'],
            clientPermissions : [PermissionsBitField.Flags.SendMessages],
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
