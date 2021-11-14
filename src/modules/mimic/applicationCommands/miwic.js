'use strict';

const { ApplicationCommand } = require('../../../core');

module.exports = class Miwic extends ApplicationCommand {

    constructor() {

        super('miwic', { category : 'mimic', description : 'Miwic an uswer, uwu, ebot, or te whwole guild' });
    }

    static get subcommands() {

        return {
            user  : {
                method      : 'miwicUser',
                description : 'Cute Mimic an user',
                options     : {
                    user  : {
                        type        : ApplicationCommand.SubTypes.Member,
                        description : 'User to miwic',
                        required    : true
                    },
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Stawrwt of a swentwence to build te miwic frwom',
                        required    : false
                    }
                }
            },
            guild : {
                method      : 'miwicGuild',
                description : 'Cute Mimic the whole guild',
                options     : {
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Stawrwt of a swentwence to build te miwic frwom',
                        required    : false
                    }
                }
            },
            ebot  : {
                method      : 'miwicEbot',
                description : 'Cute Mimic Ebot',
                options     : {
                    start : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Stawrwt of a swentwence to build te miwic frwom',
                        required    : false
                    }
                }
            }
        };
    }

    async miwic(interaction, userId, start = '') {

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

                return this.client.util.send(interaction, UwuService.uwuify(`Hey <@${ interaction.user.id }>, I'm sorry but this user cannot be miwicked yet.`));
            }

            this.client.logger.error(err, err.toString());

            await this.client.util.send(interaction, UwuService.uwuify(`Whoopsy, something went wrong when trying to miwic this user.`));

            this.client.handleError(this, err, interaction);
        }

    }

    miwicEbot(interaction, { start }) {

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', 'ebot');
        }

        return this.miwic(interaction, 'ebot', start);
    }

    miwicGuild(interaction, { start }) {

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', 'guild');
        }

        return this.miwic(interaction, 'guild', start);
    }

    miwicUser(interaction, { user, start }) {

        const userId   = user?.id;
        const username = `${ user?.username }#${ user?.discriminator }`;

        if (this.client.sentry) {

            this.client.sentry.setTag('mimicked_user_id', userId);
            this.client.sentry.setTag('mimicked_username', username);
        }

        return this.miwic(interaction, userId, start);
    }
};
