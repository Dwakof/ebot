'use strict';

const { Constants }             = require('discord.js');
const { memberNicknameMention } = require('@discordjs/builders');

const DayJS        = require('dayjs');
const Duration     = require('dayjs/plugin/duration');
const RelativeTime = require('dayjs/plugin/relativeTime');

DayJS.extend(Duration);
DayJS.extend(RelativeTime);

const { Service, Util } = require('../../../core');

const { Chain } = require('../utils');

module.exports = class MimicService extends Service {

    mimic(model, { retry = 5, initialState = '' }) {

        let i        = 0;
        let response = '';

        do {

            response = model.walk(initialState || '').join(' ').trim();

            i++;

        } while ([initialState, ''].includes(response) && i < retry);

        if (response === '') {

            throw new Error(`Could not generate a non empty sentence after ${ i } retry`);
        }

        return response;
    }

    async mimicUser(guildId, userId, initialState) {

        const { Mimic } = this.client.providers('mimic');

        const { Model } = Mimic.models;

        const { model : json } = await Model.query().findById([guildId, userId]).throwIfNotFound();

        const model = Chain.fromJSON(json);

        return this.mimic(model, { initialState });
    }

    async rebuildGuild(guild, message) {

        const { HistoryService } = this.client.services('history');

        const { State } = this.client.providers('mimic');

        const status = new Util.Status({
            startAt     : new Date(),
            messages    : 0,
            totalUser   : 0,
            currentUser : 0,
            doing       : true,
            done        : false
        });

        try {

            const { doing } = await State.get('guild_rebuild', guild.id, { doing : false });

            if (doing) {

                return false;
            }

            let currentMember;

            status.on('update', (data) => {

                return this.progressRebuildGuild(guild, data, currentMember, message);
            });

            const members = await guild.members.fetch();

            status.set({ totalUser : members.size });

            await State.set('guild_rebuild', guild.id, status);

            if (message) {

                const msg = await this.progressRebuildGuild(guild, status, null, message);

                status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });
            }

            status.set({ total : await HistoryService.countMessage({ guildId : guild.id }) });

            const interval = setInterval(() => status.update(), 1200);

            for (const [, member] of members) {

                currentMember = member;

                await this.rebuildUser(guild, member, undefined, status);

                status.increase('currentUser');

                await State.set('guild_rebuild', guild.id, status);
            }

            status.set({ done : true, messages : status.get('total') });

            clearInterval(interval);
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({ message : `Could not rebuild model for guild ${ guild.name }`, error });

            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('guild_rebuild', guild.id, status);
        }
    }

    async rebuildUser(guild, member, message, parentStatus) {

        const { HistoryService } = this.client.services('history');

        const { Mimic, State } = this.client.providers('mimic');

        const { Model } = Mimic.models;

        const stateKey = `${ guild.id }_${ member.id }`;
        const query    = { guildId : guild.id, userId : member.id };

        const status = new Util.Status({ startAt : new Date(), messages : 0, doing : true, done : false });

        try {

            const { doing } = await State.get('user_rebuild', stateKey, { doing : false });

            if (doing) {

                return false;
            }

            if (message) {

                status.on('update', (data) => {

                    return this.progressRebuildUser(member, guild, data, message);
                });
            }

            await State.set('user_rebuild', stateKey, status);

            status.set({ total : await HistoryService.countMessage(query) });

            if (message) {

                const msg = await this.progressRebuildUser(member, guild, status, message);

                status.set({ url : `https://discordapp.com/channels/${ msg.guild.id }/${ msg.channel.id }/${ msg.id }` });
            }

            if (status.get('total') <= 0) {

                return false;
            }

            const model = new Chain();

            let lastMessageAt = 0;
            let interval;

            if (message) {

                interval = setInterval(() => status.update(), 1200);
            }

            for await (const { content, createdAt } of HistoryService.getMessages(query)) {

                if (content) {

                    model.build(content);
                }

                status.increase('messages');

                if (lastMessageAt < new Date(createdAt).getTime()) {

                    lastMessageAt = new Date(createdAt).getTime();
                }

                if (parentStatus) {

                    parentStatus.increase('messages');
                }
            }

            await Model.query().insert({ guildId : guild.id, userId : member.id, model : model.toJSON() })
                .onConflict(Model.idColumn).merge();

            status.set({ done : true });

            if (message) {

                clearInterval(interval);
            }

            return status.get('messages');
        }
        catch (error) {

            status.set({ failed : true });

            this.client.logger.error({
                message : `Could not rebuild model for user ${ this.client.util.username(member.user) || member.id } in guild ${ guild.name }`,
                error
            });

            this.client.logger.error(error);
        }
        finally {

            status.set({ doing : false, endAt : new Date() });

            status.update();

            await State.set('user_rebuild', stateKey, status);
        }
    }

    progressRebuildGuild(guild, status, member, message) {

        if (!message) {

            return;
        }

        const { messages, total, doing, startAt, endAt, done, failed } = status;

        const embed = this.client.util.embed();

        embed.setTitle(`Rebuilding of guild's mimic models`)
            .setAuthor(guild.name, guild.iconURL({ dynamic : false, size : 32 }))
            .setThumbnail(guild.iconURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Constants.Colors.BLUE);

        if (doing && member) {

            embed.addField('User', memberNicknameMention(member.id), true)
                .setThumbnail(member.user.avatarURL({ dynamic : false, size : 128 }));
        }

        if (doing && message) {

            embed.addField('Messages', `${ messages || 0 } out of ${ total }`, true);
        }

        if (total) {

            embed.addField('Progress', this.client.util.progressBar(messages || 0, total));
        }

        if (doing) {

            embed.setFooter(`running for ${ DayJS.duration(DayJS(startAt).diff(DayJS())).humanize() }`);
        }

        if (!doing) {

            embed.setFooter(`took ${ DayJS.duration(DayJS(startAt).diff(DayJS(endAt))).humanize() }`);
        }

        if (done) {

            embed.setTitle(`Finished rebuilding guild's mimic model`)
                .setColor(Constants.Colors.GREEN);
        }

        if (failed) {

            embed.setTitle(`Failed to rebuild guild's mimic model`)
                .setColor(Constants.Colors.RED);
        }

        return message.util.send({ embeds : [embed] });
    }

    progressRebuildUser(member, guild, status, message) {

        if (!message) {

            return;
        }

        const { messages, total, doing, startAt, endAt, done, failed } = status;

        const embed = this.client.util.embed();

        embed.setTitle(`Rebuilding mimic model`)
            .addField('User', memberNicknameMention(member.id), true)
            .setThumbnail(member.user.avatarURL({ dynamic : false, size : 128 }))
            .setTimestamp()
            .setColor(Constants.Colors.BLUE);

        if (message) {

            embed.setTitle(`Rebuilding mimic model`)
                .addField('Messages', `${ messages || 0 } out of ${ total }`, true);
        }

        if (total) {

            embed.addField('Progress', this.client.util.progressBar(messages || 0, total));
        }

        if (doing) {

            embed.setFooter(`running for ${ DayJS.duration(DayJS(startAt).diff(DayJS())).humanize() }`);
        }

        if (!doing) {

            embed.setFooter(`took ${ DayJS.duration(DayJS(startAt).diff(DayJS(endAt))).humanize() }`);
        }

        if (done) {

            embed.setTitle(`Finished rebuilding mimic model`)
                .setColor(Constants.Colors.GREEN);
        }

        if (failed) {

            embed.setTitle(`Failed to rebuild mimic model`)
                .setColor(Constants.Colors.RED);
        }

        return message.util.send({ embeds : [embed] });
    }
};

