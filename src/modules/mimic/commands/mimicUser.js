'use strict';

const { Command } = require('../../../core');

module.exports = class MimicUserCommand extends Command {

    constructor() {

        super('mimic', {
            aliases  : ['mimic'],
            category : 'mimic',
            channel  : 'guild',
            editable : false,
            args     : [
                {
                    id     : 'member',
                    type   : 'member',
                    prompt : {
                        start : 'which member do you me to mimic ?'
                    }
                },
                {
                    id      : 'initialState',
                    type    : 'rest',
                    default : ''
                }
            ]
        });
    }

    async exec(message, { member, initialState }) {

        if (member) {

            const { MimicService, ReplyService } = this.client.services('mimic');

            try {
                const temp   = await message.util.send('thinking...');
                const userId = member.user.id;

                if (this.client.sentry) {

                    this.client.sentry.setTag('mimicked_user_id', userId);
                    this.client.sentry.setTag('mimicked_username', `${ member.user.username }#${ member.user.discriminator }`);
                }

                const reply = await MimicService.mimic(message.guild.id, userId, initialState);

                const [, msg] = await Promise.all([temp.delete(), message.channel.send({ content: reply, allowedMentions : { users : [] } })]);

                await ReplyService.saveReply(msg, userId);
            }
            catch (err) {

                if (err.statusCode === 404) {

                    return message.util.send(`Hey <@${ message.author.id }>, I'm sorry but this user cannot be mimicked yet.`);
                }

                this.client.logger.error(err, err.toString());

                await message.util.send(`Woopsy, something went wrong when trying to mimic this user.`);

                this.client.handleError(this, err, message);
            }
        }
    }
};
