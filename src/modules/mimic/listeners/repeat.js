'use strict';

// eslint-disable-next-line no-unused-vars
const { Events, MessageReaction, User } = require('discord.js');

const { Listener } = require('../../../core');

module.exports = class RepeatMimicListener extends Listener {


    constructor() {

        super('repeatMimicListener', { emitter : 'client', event : Events.MessageReactionAdd });
    }

    /**
     * @param {MessageReaction} reaction
     * @param {User}            user
     *
     * @returns {Promise<void>}
     */
    async exec(reaction, user) {

        if (user.bot) {

            return;
        }

        const { ReplyService, MimicService } = this.services();

        const originalReply = await ReplyService.findReply(reaction.message.guildId, reaction.message.id);

        if (originalReply) {

            const reply = await MimicService.mimic(originalReply.guildId, originalReply.userId, originalReply.start);

            const msg = await reaction.message.reply({ content : reply, allowedMentions : { users : [] } });

            await ReplyService.saveReply(msg, originalReply.userId, originalReply.start);

            await msg.react('🔁');
        }
    }
};

