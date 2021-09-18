'use strict';

const { SlashCommand } = require('../../../core');

module.exports = class Mimic extends SlashCommand {

    constructor() {

        super('mimic', { category : 'mimic', description : 'Mimic an user' });
    }

    static get command() {

        return {
            method  : 'mimicUser',
            options : {
                user  : {
                    type        : SlashCommand.Types.Member,
                    description : 'User to mimic',
                    required    : true
                },
                start : {
                    type        : SlashCommand.Types.String,
                    description : 'Start of a sentence to build the mimic from',
                    required    : false
                }
            }
        };
    }

    async mimicUser(interaction, { user, start }) {

        const { MimicService, ReplyService } = this.client.services('mimic');

        try {

            const userId = user.id;

            await interaction.deferReply();

            if (this.client.sentry) {

                this.client.sentry.setTag('mimicked_user_id', userId);
                this.client.sentry.setTag('mimicked_username', `${ user.username }#${ user.discriminator }`);
            }

            const reply = await MimicService.mimicUser(interaction.guildId, userId, start);

            const msg = await interaction.editReply({ content: reply, allowedMentions : { users : [] } });

            await ReplyService.saveReply(msg, userId);
        }
        catch (error) {

            if (error.statusCode === 404) {

                return interaction.editReply(`Hey <@${ interaction.user.id }>, I'm sorry but this user cannot be mimicked yet.`);
            }

            this.client.logger.error({ error, message : error.toString() });

            await interaction.editReply(`Woopsy, something went wrong when trying to mimic this user.`);

            this.client.handleError(this, error, interaction);
        }
    }
};
