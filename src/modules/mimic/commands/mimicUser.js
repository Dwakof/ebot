'use strict';

const { Command } = require('discord-akairo');

const Mimic = require('../utils/mimic');

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

            try {
                const temp = await message.util.send('thinking...');

                const guildId = message.guild.id;
                const userId  = member.user.id;

                if (this.client.sentry) {

                    this.client.sentry.setTag('mimicked_user_id', userId);
                    this.client.sentry.setTag('mimicked_username', `${ member.user.username }#${ member.user.discriminator }`);
                }

                const reply = await Mimic.mimicUser(this.client, guildId, userId, initialState);

                const [, msg] = await Promise.all([temp.delete(), message.channel.send(reply)]);

                const { Reply } = this.client.providers.mimic.models;

                await Reply.query().insert({ messageId : msg.id, guildId, userId, content : reply });
            }
            catch (error) {

                if (error.statusCode === 404) {

                    return message.util.send(`Hey <@${ message.author.id }>, I'm sorry but this user cannot be mimicked yet.`);
                }

                await message.util.send(`Woopsy, something went wrong when trying to mimic this user.`);

                this.client.handleError(this, error, message);
            }
        }
    }
};
