'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class Mimic extends ApplicationCommand {

    constructor() {

        super('mimic', { description : 'Mimic an user, ebot, or the whole guild' });
    }

    static get subcommands() {

        return {
            user  : {
                method      : 'mimicUser',
                description : 'Mimic an user',
                options     : {
                    user  : {
                        type        : ApplicationCommand.SubTypes.Member,
                        description : 'User to mimic',
                        required    : true
                    },
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Start of a sentence to build the mimic from',
                        required    : false
                    }
                }
            },
            guild : {
                method      : 'mimicGuild',
                description : 'Mimic the whole guild',
                options     : {
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Start of a sentence to build the mimic from',
                        required    : false
                    }
                }
            },
            ebot  : {
                method      : 'mimicEbot',
                description : 'Mimic Ebot',
                options     : {
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Start of a sentence to build the mimic from',
                        required    : false
                    }
                }
            }
        };
    }

    async mimic(interaction, userId, start = '') {

        const { MimicService, ReplyService } = this.services();

        try {

            await interaction.deferReply();

            const reply = await MimicService.mimic(interaction.guildId, userId, start);

            const msg = await interaction.editReply({ content : reply, allowedMentions : { users : [] } });

            await ReplyService.saveReply(msg, userId, start);

            await msg.react('🔁');
        }
        catch (err) {

            if (err.statusCode === 404) {

                return this.client.util.send(interaction, `Hey <@${ interaction.user.id }>, I'm sorry but this user cannot be mimicked yet.`);
            }

            this.client.logger.error(err, err.toString());

            await this.client.util.send(interaction, `Whoopsy, something went wrong when trying to mimic this user.`);

            this.client.handleError(this, err, interaction);
        }

    }

    mimicEbot(interaction, { start }) {

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', 'ebot');
        }

        return this.mimic(interaction, 'ebot', start);
    }

    mimicGuild(interaction, { start }) {

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', 'guild');
        }

        return this.mimic(interaction, 'guild', start);
    }

    mimicUser(interaction, { user, start }) {

        const userId   = user?.id;
        const username = `${ user?.username }#${ user?.discriminator }`;

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', userId);
            this.client.sentry.setTag('mimicked_username', username);
        }

        return this.mimic(interaction, userId, start);
    }
};
