'use strict';

// eslint-disable-next-line no-unused-vars
const { Snowflake, GuildMember, VoiceChannel, PermissionsBitField, ChannelType } = require('discord.js');
const { DiscordAPIError }                                                        = require('@discordjs/rest');

const { Service, Util } = require('../../../core');

class TemporaryChannelService extends Service {

    /**
     * @typedef {import('discord.js').Snowflake} Snowflake
     */

    /**
     * @typedef {Object} TemporaryChannel
     * @property {import('discord.js').GuildVoice}                         channel
     * @property {import('discord.js').GuildMember}                        owner
     * @property {Object}                                                  config
     * @property {Snowflake}                                                 config.ownerId
     * @property {Snowflake}                                                 config.messageId
     * @property {'public'|'locked'|'private'}                               config.type
     * @property {Map<Snowflake, { id : Snowflake, type : 'role'|'user' }>}  config.whitelist
     * @property {Map<Snowflake, { id : Snowflake, type : 'role'|'user' }>}  config.blacklist
     * @property {number}                                                    config.size
     */

    static get cron() {

        return {
            build : {
                schedule : '0 */10 * * * *',
                job      : 'cleanupOldChannels'
            }
        };
    }

    static get caching() {

        return {
            getRegions : { ttl : Util.HOUR }
        };
    }

    /**
     * @return {Promise<import('discord.js').Collection<string, import('discord.js').VoiceRegion>>}
     */
    getRegions() {

        return this.client.fetchVoiceRegions();
    }

    /**
     * @param {import('discord.js').Guild}        guild
     * @param {TemporaryChannel['config']} config
     *
     * @returns {import('discord.js').OverwriteResolvable[]}
     */
    buildPermissions(guild, config) {

        const view = [
            PermissionsBitField.Flags.ReadMessageHistory,
            PermissionsBitField.Flags.ViewChannel
        ];

        const access = [
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.Connect,
            PermissionsBitField.Flags.Speak
        ];

        const permissions = [
            { id : config.ownerId, allow : [...view, ...access] },
            { id : this.client.user.id, allow : [PermissionsBitField.Flags.ManageChannels, ...view, ...access] }
        ];

        switch (config.type) {

            case 'public': {

                permissions.push({ id : guild.roles.everyone.id, allow : access });

                break;
            }

            case 'locked': {

                permissions.push({ id : guild.roles.everyone.id, allow : view, deny : access });

                break;
            }

            case 'private': {

                permissions.push({ id : guild.roles.everyone.id, deny : [...view, ...access] });

                break;
            }
        }

        for (const [id] of (config.whitelist ?? /** @type {TemporaryChannel['config']['whitelist']} */ new Map())) {

            permissions.push({ id, allow : [...view, ...access] });
        }

        for (const [id] of (config.blacklist ?? /** @type {TemporaryChannel['config']['blacklist']} */ new Map())) {

            permissions.push({ id, deny : [...view, ...access] });
        }

        return permissions;
    }

    /**
     * @param {Hub}                               hub
     * @param {import('discord.js').GuildMember}  owner
     *
     * @returns {TemporaryChannel}
     */
    async createTemporaryChannel(hub, owner) {

        const { ControlView } = this.views();

        /** @type {TemporaryChannelService['config']} */
        const config = {
            ownerId   : owner.id,
            size      : hub.config.defaultSize ?? 10,
            type      : hub.config.defaultType ?? 'public',
            whitelist : new Map(),
            blacklist : new Map(),
            messageId : null
        };

        const channel = await hub.channel.guild.channels.create({
            name                 : `${ owner.displayName }'s channel`,
            type                 : ChannelType.GuildVoice,
            parent               : hub.channel.parent,
            userLimit            : config.size,
            permissionOverwrites : this.buildPermissions(hub.channel.guild, config)
        });

        const message = await channel.send(ControlView.controlMessage({ channel, owner, config }));

        config.messageId = message.id;

        await Promise.all([
            this.update({ channel, owner, config }),
            this.store.set('control', channel.guild.id, message.id, { channelId : channel.id })
        ]);

        this.client.logger.info({
            msg      : `Created temporary channel ${ channel.name } in ${ hub.channel.guild.name } for : ${ owner.displayName }`,
            emitter  : `${ this.module }.${ this.id }`,
            event    : 'createTemporaryChannel',
            metadata : {
                guildId   : hub.guildId,
                channelId : channel.id,
                ownerId   : owner.id
            }
        });

        return { channel, owner, config };
    }

    async exist(guildId, channelId) {

        const hub = await this.store.get('temporary', guildId, channelId);

        return !!hub;
    }

    async _getTemporaryChannel(guildId, channelId) {

        const temp = await this.store.get('temporary', guildId, channelId);

        if (!temp) {

            return null;
        }

        temp.value.blacklist = new Map(temp.value.blacklist.map(({ id, type }) => [id, { id, type }]));
        temp.value.whitelist = new Map(temp.value.whitelist.map(({ id, type }) => [id, { id, type }]));

        return temp;
    }

    /**
     * @param {import('discord.js').Snowflake} guildId
     * @param {import('discord.js').Snowflake} channelId
     * @return {TemporaryChannel|null}
     */
    async getTemporaryChannel(guildId, channelId) {

        const temp = await this._getTemporaryChannel(guildId, channelId);

        if (!temp) {

            return null;
        }

        const channel = await this.client.channels.fetch(channelId);
        const owner   = await channel.guild.members.fetch(temp.value.ownerId);

        return { channel, owner, config : temp.value };
    }

    /**
     * @param {import('discord.js').VoiceState} state
     * @return {TemporaryChannel|null}
     */
    async getTemporaryChannelFromVoiceState(state) {

        if (!state.guild) {

            return null;
        }

        const temp = await this._getTemporaryChannel(state.guild.id, state.channelId);

        if (!temp) {

            return null;
        }

        return {
            channel : state.channel,
            owner   : await state.guild.members.fetch(temp.value.ownerId),
            config  : temp.value
        };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     * @returns {TemporaryChannel}
     */
    async update({ channel, owner, config }) {

        const { value } = await this.store.set('temporary', channel.guild.id, channel.id, {
            ...config,
            blacklist : Array.from(config.blacklist.values()),
            whitelist : Array.from(config.whitelist.values())
        });

        value.blacklist = new Map(value.blacklist.map(({ id, type }) => [id, { id, type }]));
        value.whitelist = new Map(value.whitelist.map(({ id, type }) => [id, { id, type }]));

        return { channel, owner, config : value };
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     */
    async updatePermission({ channel, config }) {

        await channel.permissionOverwrites.set(this.buildPermissions(channel.guild, config));
    }

    /**
     * @param {TemporaryChannel} temporaryChannel
     */
    async updateName({ channel, owner }) {

        await channel.edit({ name : `${ owner.displayName }'s channel` });
    }

    /**
     * @property {import('discord.js').GuildVoice}  channel
     *
     * @return {Promise<null>}
     */
    async deleteTemporaryChannel(channel) {

        const temp = await this.store.get('temporary', channel.guild.id, channel.id);

        if (!temp) {

            return null;
        }

        await channel.fetch({ force : true });

        if (channel.members.size > 0) {

            return null;
        }

        await channel.delete('Temporary channel deleted');

        await Promise.all([
            this.store.delete('temporary', channel.guild.id, channel.id),
            this.store.delete('control', channel.guild.id, temp.value.messageId)
        ]);

        this.client.logger.info({
            msg      : `Deleted temporary channel ${ channel.name } in ${ channel.guild.name } for : ${ temp.value.ownerId }`,
            emitter  : `${ this.module }.${ this.id }`,
            event    : 'deleteTemporaryChannel',
            metadata : {
                guildId   : channel.guildId,
                ownerId   : temp.value.ownerId,
                channelId : channel.id
            }
        });
    }

    async deleteById(guildId, channelId) {

        const item = await this.store.get('temporary', guildId, channelId);

        if (item) {

            if (item?.value?.messageId) {

                await this.store.delete('control', guildId, item.value.messageId);
            }

            await this.store.delete('temporary', guildId, channelId);
        }
    }

    async cleanupOldChannels() {

        for (const [, oauthGuild] of await this.client.guilds.fetch()) {

            const guild = await oauthGuild.fetch();

            for (const channelId of await this.store.listIds('temporary', guild.id)) {

                try {

                    const channel = await guild.channels.fetch(channelId);

                    if (channel.members.size === 0) {

                        await this.deleteTemporaryChannel(channel);
                    }
                }
                catch (err) {

                    if (err instanceof DiscordAPIError && err.code === 10003) {

                        // Channel was deleted from discord already

                        const { value } = await this.store.get('temporary', guild.id, channelId);

                        await this.store.delete('temporary', guild.id, channelId);

                        if (value.messageId) {

                            await this.store.delete('control', guild.id, value.messageId);
                        }

                        continue;
                    }

                    this.client.logger.error({
                        msg      : `Failed to cleanup temporary channel ${ channelId } in ${ guild.name }`,
                        emitter  : `${ this.module }.${ this.id }`,
                        event    : 'cleanupOldChannels',
                        metadata : { channelId, guildId : guild.id },
                        err
                    });
                }
            }
        }
    }
}

module.exports = TemporaryChannelService;
