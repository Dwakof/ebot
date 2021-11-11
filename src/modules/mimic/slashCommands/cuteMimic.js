'use strict';

const { SlashCommand } = require('../../../core');

module.exports = class CuteMimic extends SlashCommand {

    constructor() {

        super('cute-mimic', { category : 'mimic', description : 'Mimic an uswer, uwu, ebot, or te whwole guild' });
    }

    static get subcommands() {

        return {
            user  : {
                method      : 'mimicUser',
                description : 'Cute Mimic an user',
                options     : {
                    user  : {
                        type        : SlashCommand.Types.Member,
                        description : 'User to mimic',
                        required    : true
                    },
                    start : {
                        type        : SlashCommand.Types.String,
                        description : 'Stawrwt of a swentwence to build te mimic frwom',
                        required    : false
                    }
                }
            },
            guild : {
                method      : 'mimicGuild',
                description : 'Cute Mimic the whole guild',
                options     : {
                    start : {
                        type        : SlashCommand.Types.String,
                        description : 'Stawrwt of a swentwence to build te mimic frwom',
                        required    : false
                    }
                }
            },
            ebot  : {
                method      : 'mimicEbot',
                description : 'Cute Mimic Ebot',
                options     : {
                    start : {
                        type        : SlashCommand.Types.String,
                        description : 'Stawrwt of a swentwence to build te mimic frwom',
                        required    : false
                    }
                }
            }
        };
    }

    async mimic(interaction, userId, start = '') {

        const { MimicService, ReplyService } = this.client.services('mimic');
        const { UwuService } = this.client.services('meme');

        try {

            await interaction.deferReply();

            const reply = await MimicService.mimic(interaction.guildId, userId, start);

            const uwuified = UwuService.uwuify(reply);

            const msg = await interaction.editReply({ content : uwuified, allowedMentions : { users : [] } });

            await ReplyService.saveReply(msg, userId);
        }
        catch (err) {

            if (err.statusCode === 404) {

                return this.client.util.send(interaction, UwuService.uwuify(`Hey <@${ interaction.user.id }>, I'm sorry but this user cannot be mimicked yet.`));
            }

            this.client.logger.error(err, err.toString());

            await this.client.util.send(interaction, UwuService.uwuify(`Whoopsy, something went wrong when trying to mimic this user.`));

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
