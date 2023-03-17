'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class Karma extends ApplicationCommand {

    constructor() {

        super('karma', { category : 'karma', description : 'Get karma stats for a user, by default you' });
    }

    static get command() {

        return {
            method  : 'getUser',
            options : {
                user : {
                    type        : ApplicationCommand.SubTypes.Member,
                    description : 'User to get the karma stats from',
                    required    : false
                }
            }
        };
    }

    async getUser(interaction, { user } = {}) {

        let member = interaction.member;

        if (user) {

            member = interaction.guild.members.resolve(user);
        }

        const { KarmaService } = this.services();
        const { KarmaView }    = this.views();

        const info = await KarmaService.getInfoUser(interaction.guildId, member.id);

        this.client.logger.info({ info });

        if (!info) {

            return interaction.reply(KarmaView.notRanked(member));
        }

        return interaction.reply(await KarmaView.render(member, info));
    }
};
