'use strict';

const { Colors }      = require('discord.js');
const { userMention } = require('discord.js');

const { DateTime } = require('luxon');

const { Service, Util } = require('../../../core');

const { Chain } = require('../utils');

module.exports = class BuildService extends Service {

    static USER_STATE  = 'user_build';
    static GUILD_STATE = 'guild_build';

    /**
     * @param guildId
     * @param type
     * @param id
     * @param query
     * @param countMethod
     * @param messageGenerator
     * @return {Util.Task}
     */
    buildThing(guildId, { type, id, query = { guildId }, countMethod, messageGenerator }) {

        const { Mimic, State } = this.providers();

        const { Model } = Mimic.models;

        const stateKey = `${ guildId }_${ id }`;

        return new Util.Task(async (task) => {

            try {

                task.set({ type, id, messages : 0 });

                const { doing } = await State.get(BuildService.USER_STATE, stateKey, { doing : false });

                if (doing) {

                    return false;
                }

                await State.set(BuildService.USER_STATE, stateKey, task);

                task.set({ total : await countMethod(query) });

                if (task.get('total') <= 0) {

                    return false;
                }

                const model = new Chain();

                this.client.logger.debug(`[${ this.module }.${ this.id }] Building model guildId=${ guildId } type=${ type } id=${ id }`);

                for await (const { content } of messageGenerator(query)) {

                    if (content) {

                        model.build(content);
                    }

                    task.increase('messages');
                }

                await Model.query().insert({ guildId, userId : id, model : model.toJSON() })
                    .onConflict(Model.idColumn).merge();

                task.done();

                this.client.logger.debug(`[${ this.module }.${ this.id }] Done building model guildId=${ guildId } type=${ type } id=${ id } took=${ Util.getTimeString(task.took()) }`);
            }
            catch (err) {

                task.failed(err);

                this.client.logger.error({
                    msg : `Could not rebuild model for ${ type } ${ id } in guild ${ guildId }`,
                    err
                });
            }
            finally {

                task.enforceStop();

                await State.set(BuildService.USER_STATE, stateKey, task);
            }
        });
    }

    /**
     * @param guildId
     * @param userId
     * @return {Util.Task}
     */
    buildUser(guildId, userId) {

        const { HistoryService } = this.services('history');

        return this.buildThing(guildId, {
            type             : 'user',
            id               : userId,
            query            : { guildId, userId },
            countMethod      : HistoryService.countMessages.bind(HistoryService),
            messageGenerator : HistoryService.getMessages.bind(HistoryService)
        });
    }

    /**
     * @param guildId
     * @return {Util.Task}
     */
    buildEbot(guildId) {

        const { ReplyService } = this.services();

        return this.buildThing(guildId, {
            type             : 'ebot',
            id               : 'ebot',
            query            : { guildId },
            countMethod      : ReplyService.countReplies.bind(ReplyService),
            messageGenerator : ReplyService.getReplies.bind(ReplyService)
        });
    }

    /**
     * @param guildId
     * @return {Util.Task}
     */
    buildGuild(guildId) {

        const { HistoryService } = this.services('history');

        return this.buildThing(guildId, {
            type             : 'user',
            id               : 'guild',
            query            : { guildId },
            countMethod      : HistoryService.countMessages.bind(HistoryService),
            messageGenerator : HistoryService.getMessages.bind(HistoryService)
        });
    }

    buildAll(guildId) {

        const { HistoryService } = this.services('history');

        const { State } = this.providers();

        return new Util.Task(async (task) => {

            try {

                task.set({ type : 'guild', messages : 0, total : 0, count : 0 });

                const { doing } = await State.get(BuildService.GUILD_STATE, guildId, { doing : false });

                if (doing) {

                    return false;
                }

                const guild = await this.client.guilds.fetch(guildId);
                let members = await guild.members.fetch();

                members = members.filter((m) => !m.user.bot);

                task.set({ total : members.size + 2 });

                await State.set(BuildService.GUILD_STATE, guildId, task);

                task.set({ messages : await HistoryService.countMessages({ guildId }) });

                for (const [, member] of members) {

                    task.set({ user : member.id });
                    task.increase('count');

                    await this.buildUser(guildId, member.id);

                    await State.set(BuildService.GUILD_STATE, guildId, task);
                }

                task.set({ user : 'ebot' });
                task.increase('count');

                await this.buildEbot(guildId);

                task.set({ user : 'guild' });
                task.increase('count');

                await this.buildGuild(guildId);

                task.done();
            }
            catch (error) {

                task.failed(error);

                this.client.logger.error(error, `Could not rebuild model for guild ${ guildId }`);
            }
            finally {

                task.enforceStop();

                await State.set(BuildService.GUILD_STATE, guildId, task);
            }
        });
    }

    /**
     * @param guildId
     * @param {Util.Task} task
     * @return {EmbedBuilder}
     */
    progressBuild(guildId, task) {

        const { startAt, endAt, messages = 0, total = 0, count = 0, doing, done, failed, user } = task.getAll();

        const embed = this.client.util.embed();

        const guild = this.client.guilds.cache.get(guildId);

        embed.setTitle(`Building of guild's mimic models`)
            .setAuthor(guild.name, guild.iconURL({ dynamic : false, size : 32 }))
            .setThumbnail(guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Colors.Blue);

        if (messages) {

            embed.addFields([{ name : 'Messages', value : `${ messages }`, inline : true }]);
        }

        if (total) {

            embed.addFields([{ name : 'Users', value : `${ total }`, inline : true }]);
        }

        if (doing && user) {

            switch (user) {
                case 'ebot' :

                    embed.addFields([{ name : 'User', value : userMention(this.client.user.id), inline : true }])
                        .setThumbnail(this.client.user.avatarURL({ dynamic : false, size : 128 }));
                    break;
                case 'guild' :

                    embed.addFields([{ name : 'User', value : 'Guild', inline : true }]);
                    break;
                default:

                    const member = guild.members.cache.get(user);

                    embed.addFields([{ name : 'User', value : userMention(member.id), inline : true }])
                        .setThumbnail(member.user.avatarURL({ dynamic : false, size : 128 }));
                    break;
            }
        }

        if (total) {

            embed.addFields([{ name : 'Progress', value : this.client.util.progressBar(count, total) }]);
        }

        if (startAt) {

            embed.setFooter({ text : `Running for ${ new DateTime(startAt).toRelative() }` });
        }

        if (startAt && !doing) {

            embed.setFooter({ text : `Took ${ new DateTime(startAt).diff(new DateTime(endAt)).toHuman() }` });
        }

        if (done) {

            embed.setTitle(`Finished building guild's mimic model`)
                .setColor(Colors.Green);
        }

        if (failed) {

            embed.setTitle(`Failed to build guild's mimic model`)
                .setColor(Colors.Red);
        }

        return embed;
    }

    async build(guildId, interaction) {

        let message;
        let task = new Util.Task();

        const send = () => {

            const payload = { embeds : [this.progressBuild(guildId, task)] };

            if (message) {

                return message.edit(payload);
            }

            return this.client.util.send(interaction, payload);
        };

        const interval = setInterval(() => send(), 1500);

        try {

            task = this.buildAll(guildId);

            message = await send();

            task.set({ url : Util.linkUrl({ message }) });

            await task;

            return task.getAll();
        }
        catch (err) {

            this.client.logger.error({ msg : `Could not build model for guild ${ guildId }`, err });
        }
        finally {

            clearInterval(interval);

            await send();
        }
    }

    async cronBuild() {

        for (const guildId of this.client.guilds.cache.map((guild) => guild.id)) {

            try {

                await this.buildAll(guildId);
            }
            catch (err) {

                this.client.logger.error({ msg : `Could not build model for guild ${ guildId }`, err });
            }
        }
    }

    static get cron() {

        return {
            build : {
                schedule : '0 0 * * * *',
                job      : 'cronBuild'
            }
        };
    }
};
