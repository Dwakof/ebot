'use strict';

const { PermissionsBitField } = require('discord.js');

const { Command } = require('../../../core');

module.exports = class AhegaoCommand extends Command {

    constructor() {

        super('ahegao', {
            aliases           : ['ahegao'],
            clientPermissions : [PermissionsBitField.Flags.SendMessages],
            args              : [],
            description       : {
                content  : 'ahegao',
                usage    : 'ahegao',
                examples : ['ahegao']
            }
        });
    }

    async exec(message, args) {

        await message.channel.send(this.client.util.codeBlock(`
⠀⠀⠀⢰⣧⣼⣯⠀⣸⣠⣶⣶⣦⣾⠀⠀⠀⠀⡀⠀⢀⣿⣿⠀⠀⠀⢸⡇⠀⠀
⠀⠀⠀⣾⣿⠿⠿⠶⠿⢿⣿⣿⣿⣿⣦⣤⣄⢀⡅⢠⣾⣛⡉⠀⠀⠀⠸⢀⣿⠀
⠀⠀⢀⡋⣡⣴⣶⣶⡀⠀⠀⠙⢿⣿⣿⣿⣿⣿⣴⣿⣿⣿⢃⣤⣄⣀⣥⣿⣿⠀
⠀⠀⢸⣇⠻⣿⣿⣿⣧⣀⢀⣠⡌⢻⣿⣿⣿⣿⣿⣿⣿⣿⣿⠿⠿⠿⣿⣿⣿⠀
⠀⢀⢸⣿⣷⣤⣤⣤⣬⣙⣛⢿⣿⣿⣿⣿⣿⣿⡿⣿⣿⡍⠀⠀⢀⣤⣄⠉⠋⣰
⠀⣼⣖⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣿⣿⣿⣿⣿⢇⣿⣿⡷⠶⠶⢿⣿⣿⠇⢀⣤
⠘⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣽⣿⣿⣿⡇⣿⣿⣿⣿⣿⣿⣷⣶⣥⣴⣿⡗
⢀⠈⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⠀
⢸⣿⣦⣌⣛⣻⣿⣿⣧⠙⠛⠛⡭⠅⠒⠦⠭⣭⡻⣿⣿⣿⣿⣿⣿⣿⣿⡿⠃⠀
⠘⣿⣿⣿⣿⣿⣿⣿⣿⡆⠀⠀⠀⠀⠀⠀⠀⠀⠹⠈⢋⣽⣿⣿⣿⣿⣵⣾⠃⠀
⠀⠘⣿⣿⣿⣿⣿⣿⣿⣿⠀⣴⣿⣶⣄⠀⣴⣶⠀⢀⣾⣿⣿⣿⣿⣿⣿⠃⠀⠀
⠀⠀⠈⠻⣿⣿⣿⣿⣿⣿⡄⢻⣿⣿⣿⠀⣿⣿⡀⣾⣿⣿⣿⣿⣛⠛⠁⠀⠀⠀
⠀⠀⠀⠀⠈⠛⢿⣿⣿⣿⠁⠞⢿⣿⣿⡄⢿⣿⡇⣸⣿⣿⠿⠛⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣿⣾⣦⡙⠻⣷⣾⣿⠃⠿⠋⠁⠀⠀⠀⠀⠀⢀⣠⣴
⣿⣿⣿⣶⣶⣮⣥⣒⠲⢮⣝⡿⣿⣿⡆⣿⡿⠃⠀⠀⠀⠀⠀⠀⠀⣠⣴⣿⣿⣿
`));
    }
};
