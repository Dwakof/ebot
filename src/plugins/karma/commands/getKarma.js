'use strict';

const { Command } = require('discord-akairo');

const Karma = require('../karma');

module.exports = class GetKarmaCommand extends Command {

    constructor() {

        super('karma', {
            aliases  : ['karma'],
            channel  : 'guild',
            editable : true,
            args     : [
                {
                    id     : 'member',
                    type   : 'member',
                    prompt : {
                        start : 'which member do you want to see the karma balance?'
                    }
                }
            ]
        });
    }

    async exec(message, { member }) {

        if (member) {

            const embed = this.client.util.embed().setTitle(`Karma for ${ member.user.username }`);

            const { Member } = this.client.providers.karma.models;

            await message.util.send(embed);

            const [stats] = await Member.query()
                .with('sumTable', Member.query()
                    .select('guildId', 'userId')
                    .sum({ karma : 'value' })
                    .groupBy('guildId', 'userId')
                )
                .with('rankTable', Member.query()
                    .select([
                        '*',
                        Member.knex().raw('RANK() OVER ( ORDER BY karma DESC ) rank'),
                        Member.knex().raw('COUNT() OVER () total')
                    ])
                    .from('sumTable')
                )
                .from('rankTable')
                .where({ guildId : message.guild.id, userId : member.user.id }).limit(1);

            if (!stats) {

                embed.setDescription('User not ranked yet');

                return message.util.send(embed);
            }

            let rankString = `${ stats.rank }${ Karma.ordinalSuffix(stats.rank) }`;

            switch (stats.rank) {
                case 1:
                    rankString = `🥇️ ${ rankString }`;
                    break;
                case 2:
                    rankString = `🥈️️ ${ rankString }`;
                    break;
                case 3:
                    rankString = `🥉️ ${ rankString }`;
                    break;
                case stats.total:
                    rankString = `💩️ ${ rankString }`;
                    break;
                default:
            }

            embed.addFields([
                { name : 'Karma', value : stats.karma, inline : true },
                { name : 'Rank', value : rankString, inline : true }
            ]);

            return message.util.send(embed);
        }
    }
};

