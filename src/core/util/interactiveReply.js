'use strict';

/* eslint-disable no-unused-vars */
const { Message, BaseInteraction, AnyComponentBuilder, Guild, User, InteractionCollector, EmbedBuilder } = require('discord.js');
const { ButtonStyle, TextInputStyle, BuildersSelectMenuOption, SelectMenuComponentOptionData }           = require('discord.js');
const { APISelectMenuOption, ActionRowBuilder, ButtonBuilder, SelectMenuBuilder }                        = require('discord.js');
const { TextInputBuilder, ComponentType, ModalBuilder, APIMessageComponentEmoji }                        = require('discord.js');
/* eslint-enable no-unused-vars */

const Random = require('./random');

/**
 * @typedef {Object} ComponentOptions
 *
 * @property {String}               id
 * @property {String}               type
 * @property {Function}             [onAction]
 * @property {Function}             [onReply]
 * @property {Function}             [hide]
 *
 * @property {Boolean|Function}                                                                                  [disabled]
 * @property {String|Function}                                                                                   [label]
 * @property {String|Function}                                                                                   [placeholder]
 * @property {ButtonStyle|TextInputStyle|Function}                                                               [style]
 * @property {Number|Function}                                                                                   [max_values]
 * @property {Number|Function}                                                                                   [min_values]
 * @property {Number|Function}                                                                                   [max_length]
 * @property {Number|Function}                                                                                   [min_length]
 * @property {String|Function}                                                                                   [value]
 * @property {String|Function}                                                                                   [url]
 * @property {String|APIMessageComponentEmoji|Function}                                                          [emoji]
 * @property {RestOrArray<BuildersSelectMenuOption|SelectMenuComponentOptionData|APISelectMenuOption>|Function}  [options]
 */

/**
 * @typedef {Object} InteractiveReplyOptions
 *
 * @property {Array<ComponentOptions>} components
 * @property {Number}                  [timeout=120000]
 * @property {Boolean}                 [hideComponentsOnEnd=true]
 * @property {Boolean}                 [ephemeral=false]
 * @property {Function}                [onReply]
 */

class ComponentBased {

    #hooks = {
        /**
         * @type {Map<String, Function>}
         */
        onAction : new Map(),
        /**
         * @type {Map<String, Array<Function>>}
         */
        onReply : new Map(),
        /**
         * @type {Map<String, Function>}
         */
        hide : new Map()
    };

    /**
     * @type {Map<String, AnyComponentBuilder>}
     */
    #components = new Map();

    #config;

    /**
     * @param {Array<ComponentOptions>} [components=[]]
     */
    constructor(components = []) {

        this.#config = components;
    }

    static get InputType() {

        return {
            Button : ComponentType.Button,
            Select : ComponentType.SelectMenu,
            Text   : ComponentType.TextInput
        };
    }

    static get InputSize() {

        return {
            [ComponentType.SelectMenu] : 5,
            [ComponentType.TextInput]  : 5,
            [ComponentType.Button]     : 1
        };
    }

    setupComponents() {

        this.#components = new Map();

        for (const component of this.#config) {

            const { id, type, onAction, onReply, hide } = component;

            this.#hooks.onReply.set(id, []);

            switch (type) {

                case ComponentBased.InputType.Button:

                    this.#components.set(id, this.setupButton(component));

                    break;

                case ComponentBased.InputType.Select:

                    this.#components.set(id, this.setupSelect(component));

                    break;


                case ComponentBased.InputType.Text:

                    this.#components.set(id, this.setupText(component));

                    break;


                default:

                    throw new Error(`Components type "${ type }" not supported`);
            }

            if (typeof onReply === 'function') {

                this.#hooks.onReply.get(id).push(onReply.bind(this));
            }

            if (typeof onAction === 'function') {

                this.#hooks.onAction.set(id, onAction.bind(this));
            }

            if (typeof hide === 'function') {

                this.#hooks.hide.set(id, hide.bind(this));
            }
        }
    }

    registerHook(id, attribute, func) {

        if (attribute === undefined) {

            return;
        }

        if (typeof attribute === 'function') {

            return this.#hooks.onReply.get(id).push((input, ...data) => input[func](attribute.call(this, input, ...data)));
        }

        return this.#hooks.onReply.get(id).push((input) => input[func](attribute));
    }

    setupButton(component) {

        const { id, label, disabled, style, url, emoji } = component;

        this.registerHook(id, style, 'setStyle');
        this.registerHook(id, label, 'setLabel');
        this.registerHook(id, disabled, 'setDisabled');
        this.registerHook(id, emoji, 'setEmoji');
        this.registerHook(id, url, 'setURL');

        return new ButtonBuilder({ customId : id, style });
    }

    setupSelect(component) {

        const { id, options, placeholder, min_values, max_values, disabled } = component;

        this.registerHook(id, placeholder, 'setPlaceholder');
        this.registerHook(id, max_values, 'setMaxValues');
        this.registerHook(id, min_values, 'setMinValues');
        this.registerHook(id, disabled, 'setDisabled');
        this.registerHook(id, options, 'setOptions');

        return new SelectMenuBuilder({ customId : id });
    }

    setupText(component) {

        const { id, label, placeholder, style, max_length, min_length, value, required } = component;

        this.registerHook(id, style, 'setStyle');
        this.registerHook(id, label, 'setLabel');
        this.registerHook(id, placeholder, 'setPlaceholder');
        this.registerHook(id, max_length, 'setMaxLength');
        this.registerHook(id, min_length, 'setMinLength');
        this.registerHook(id, required, 'setRequired');
        this.registerHook(id, value, 'setValue');

        return new TextInputBuilder({ customId : id });
    }

    /**
     * @returns {ActionRowBuilder<AnyComponentBuilder>[]}
     */
    buildActionRows() {

        return Array.from(this.#components.entries()).reduce((rows, [id, component]) => {

            if (this.#hooks.hide.has(id) && this.#hooks.hide.get(id)(this.#components.get(id))) {

                return rows;
            }

            let actionRowBuilder = rows[rows.length - 1];

            if (ComponentBased.actionRowSize(actionRowBuilder) + ComponentBased.InputSize[component.data.type] > 5) {

                actionRowBuilder = new ActionRowBuilder();

                rows.push(actionRowBuilder);
            }

            actionRowBuilder.addComponents(component);

            return rows;

        }, [new ActionRowBuilder()]);
    }

    /**
     *
     * @param {ActionRowBuilder<AnyComponentBuilder>} actionRowBuilder
     *
     * @return {Number}
     */
    static actionRowSize(actionRowBuilder) {

        return actionRowBuilder.components.reduce((total, component) => total + ComponentBased.InputSize[component.data.type], 0);
    }

    onReply() {

        for (const [id, hooks = []] of this.#hooks.onReply.entries()) {

            for (const hook of hooks) {

                hook(this.#components.get(id));
            }
        }
    }

    onAction(interaction, id, ...data) {

        if (this.#hooks.onAction.has(id)) {

            return this.#hooks.onAction.get(id)(this.#components.get(id), interaction, ...data);
        }
    }

    /**
     * @return {String[]}
     */
    get componentIds() {

        return Array.from(this.#components.keys());
    }

    disableEveryComponents() {

        for (const component of this.#components.values()) {

            if (!(component instanceof TextInputBuilder)) {

                component.setDisabled(true);
            }
        }
    }
}

class InteractiveReply extends ComponentBased {

    #listening      = false;
    #ended          = false;
    #ending         = false;
    #showComponents = true;

    /**
     * @type {InteractiveReplyOptions}
     */
    #options;

    /**
     * @type {Message|BaseInteraction}
     */
    #interaction;

    #reply;

    /**
     * @type {InteractionCollector}
     */
    #collector;

    /**
     * @param {Message|BaseInteraction} interaction
     * @param {InteractiveReplyOptions} [options={}]
     */
    constructor(interaction, options = {}) {

        super(options.components);

        this.#interaction = interaction;
        this.#options     = {
            hideComponentsOnEnd : true,
            ephemeral           : false,
            timeout             : 120_000,
            ...options
        };
    }

    async build() {

        throw new Error('to implement');
    }

    async send() {

        if (this.#interaction instanceof BaseInteraction && !this.#interaction.deferred) {

            await this.#interaction.deferReply({ ephemeral : this.#options.ephemeral });
        }

        this.setupComponents();

        await this.reply();

        await this.setupCollector();

        return this;
    }

    _reply(response) {

        const { followUp, ...payload } = response;

        if (this.#interaction instanceof BaseInteraction) {

            if (followUp) {

                return this.#interaction.followUp(payload);
            }

            if (this.#interaction.deferred || this.#interaction.replied) {

                return this.#interaction.editReply(payload);
            }

            return this.#interaction.reply(payload, { fetchReply : true });
        }

        if (this.#interaction instanceof Message) {

            if (this.#reply) {

                return this.#reply.edit({ ...payload, fetchReply : true });
            }

            if (this.#interaction.util) {

                return this.#interaction.util.send({ ...payload, fetchReply : true });
            }

            return this.#interaction.channel.send({ ...payload, fetchReply : true });
        }

        throw new Error(`Could not send a message using object ${ typeof this.#interaction }`);
    }

    async reply() {

        this.onReply();

        const payload = await this.build();

        payload.components = [];

        if (this.#showComponents) {

            payload.components = this.buildActionRows();
        }

        payload.ephemeral = payload.ephemeral ?? this.#options.ephemeral;

        this.#reply = await this._reply(payload);

        return this.#reply;
    }

    async setupCollector() {

        if (!this.#reply) {

            throw new Error('Cannot setup collector without a reply');
        }

        this.#collector = await this.#reply.createMessageComponentCollector({
            filter : (interaction) => this.componentIds.includes(interaction.customId),
            time   : this.#options.timeout
        });

        this.#collector.on('end', () => {

            this.#listening = false;

            if (!this.#ending) {

                return this.end();
            }
        });

        this.#collector.on('collect', async (interaction) => {

            await this.onAction(interaction, interaction.customId);

            if (!(interaction.deferred || interaction.replied)) {

                await interaction.deferUpdate();
            }

            await this.reply();

            return this.#collector.resetTimer();
        });

        this.#listening = true;
    }

    async end() {

        if (this.#ended) {

            return;
        }

        this.#ending = true;

        this.#collector.stop();

        if (this.#options.hideComponentsOnEnd) {

            this.#showComponents = false;
        }

        this.disableEveryComponents();

        try {

            this.#reply = await this.reply();

            return this.#reply;
        }
        catch (error) {

            if (error.httpStatus === 404) {

                return;
            }

            this.#interaction.client.handleError({ categoryID : 'util', id : 'InteractiveReply' }, error);
        }
        finally {

            this.#ended = true;
        }
    }

    get interaction() {

        return this.#interaction;
    }

    /**
     *
     * @return {EbotClient}
     */
    get client() {

        return this.#interaction.client;
    }

    /**
     * @returns {User}
     */
    getUser() {

        if (this.#interaction instanceof BaseInteraction) {

            return this.#interaction?.user;
        }

        if (this.#interaction instanceof Message) {

            return this.#interaction?.author;
        }
    }

    /**
     * @returns {Guild}
     */
    getGuild() {

        if (this.#interaction instanceof BaseInteraction) {

            return this.#interaction?.guild;
        }

        if (this.#interaction instanceof Message) {

            return this.#interaction?.guild;
        }
    }

    /**
     * @returns {boolean}
     */
    get ended() {

        return this.#ended;
    }

    /**
     * @returns {boolean}
     */
    get listening() {

        return this.#listening;
    }

    /**
     * @returns {boolean}
     */
    get ending() {

        return this.#ending;
    }
}

class PaginatedEmbeds extends InteractiveReply {

    /**
     * @type {Array<EmbedBuilder|Function<EmbedBuilder>|Promise<EmbedBuilder>>}
     */
    #pages;

    #footer;

    #cacheEnabled;
    #cache = new Map();

    index = 0;

    /**
     * @param {Message|BaseInteraction}                                          interaction
     * @param {Array<EmbedBuilder|Function<EmbedBuilder>|Promise<EmbedBuilder>>} pages
     * @param {InteractiveReplyOptions}                                          [options]
     * @param {Function}                                                         [options.footer]
     * @param {Boolean}                                                          [options.cache=true]
     * @param {ComponentOptions}                                                 [options.previous={}]
     * @param {ComponentOptions}                                                 [options.next={}]
     */
    constructor(interaction, pages, options = {}) {

        const { cache, footer = (page, index, total) => `Page ${ index + 1 } / ${ total }`, previous, next, ...subOptions } = options;

        super(interaction, {
            components : [
                {
                    id       : 'previous',
                    label    : 'Previous',
                    type     : ComponentBased.InputType.Button,
                    style    : ButtonStyle.Secondary,
                    disabled : () => (this.index === 0),
                    onAction : () => {

                        this.index = Math.max(this.index - 1, 0);
                    },
                    ...previous
                },
                {
                    id       : 'next',
                    label    : 'Next',
                    type     : ComponentBased.InputType.Button,
                    style    : ButtonStyle.Secondary,
                    disabled : () => (this.#pages.length - 1 === this.index),
                    onAction : () => {

                        this.index = Math.min(this.#pages.length - 1, this.index + 1);
                    },
                    ...next
                }
            ],
            ...subOptions
        });

        this.#pages        = pages;
        this.#cacheEnabled = cache;

        if (footer) {

            this.#footer = footer.bind(this);
        }
    }

    async build() {

        if (this.#cacheEnabled && this.#cache.has(this.index)) {

            return this.#cache.get(this.index);
        }

        let page = this.#pages[this.index];

        if (page instanceof Promise) {

            page = await page;
        }

        if (typeof page === 'function') {

            page = await page(this.index);
        }

        if (page instanceof EmbedBuilder) {

            page = { embeds : [page] };
        }

        if (Array.isArray(page)) {

            page = { embeds : page };
        }

        if (this.#footer) {

            for (const embed of (page.embeds ?? [])) {

                embed.setFooter({ text : this.#footer(embed, this.index, this.#pages.length) });
            }
        }

        return page;
    }

    get length() {

        return this.#pages.length;
    }

    async reply() {

        const reply = await super.reply();

        if (this.#cacheEnabled) {

            this.#cache.set(this.index, PaginatedEmbeds.serializeReply(reply));
        }
    }

    onAction(interaction, id) {

        return super.onAction(interaction, id, this.index);
    }

    static serializeReply({ embeds }) {

        return { embeds, files : [], components : [] };
    }
}

class DashboardEmbeds extends PaginatedEmbeds {

    /**
     * @typedef {Object} Dashboard
     *
     * @property {ComponentOptions.label}                                    label
     * @property {ComponentOptions.style}                                    style
     * @property {EmbedBuilder|Function<EmbedBuilder>|Promise<EmbedBuilder>} embed
     */

    /**
     *
     * @param {Message|BaseInteraction} interaction
     * @param {Array<Dashboard>}        dashboards
     * @param options
     */
    constructor(interaction, dashboards = [], options = {}) {

        const pages      = [];
        const components = [];

        for (const [index, { label, embed, style = {} }] of dashboards.entries()) {

            const { selected = ButtonStyle.Primary, unselected = ButtonStyle.Secondary } = style;

            pages.push(embed);

            components.push({
                label,
                id       : `${ index }`,
                type     : ComponentBased.InputType.Button,
                disabled : () => (index === this.index),
                style    : () => (index === this.index ? selected : unselected),
                onAction : function () {

                    this.index = index;
                },
                onReply  : function (button) {

                    button.setDisabled(false);
                    button.setStyle(unselected);

                    if (index === this.index) {

                        button.setDisabled(true);
                        button.setStyle(selected);
                    }
                }
            });
        }

        super(interaction, pages, { components, footer : false, ...options });
    }
}

class Modal extends ComponentBased {

    #id;
    #client;
    #interaction;
    #collector;
    #options;

    #listening = false;

    /**
     * @param {Message|BaseInteraction}                         interaction
     * @param {Object}                                          options
     * @param {String}                                          options.title
     * @param {Function}                                        options.reply
     * @param {Array<ComponentOptions>}                         options.components
     */
    constructor(interaction, options = {}) {

        super(options.components);

        this.#id          = Random.uuid();
        this.#options     = options;
        this.#interaction = interaction;
        this.#client      = interaction.client;
    }

    send() {

        if (this.#listening) {

            return; // Probably throw as this should not append
        }

        this.setupComponents();
        this.onReply();
        this.setupCollector();

        this.#client.logger.info({
            emitter : 'core',
            event   : 'modal.send',
            msg     : `Sending Modal ${ this.#id } named "${ this.#options.title }"`
        });

        return this.#interaction.showModal(this.buildModal());
    }

    buildModal() {

        return new ModalBuilder()
            .setCustomId(this.#id)
            .setTitle(this.#options.title)
            .addComponents(this.buildActionRows());
    }

    setupCollector() {

        this.#listening = true;

        this.#collector = this.#interaction.awaitModalSubmit({
            filter : ({ customId }) => customId === this.#id,
            time   : 10 * 60 * 1_000
        });

        this.#collector.then(async (interaction) => {

            await this.#options.reply(interaction, this.parseResponse(interaction));

            this.#listening = false;

        }).catch((err) => {

            this.#client.logger.error({
                module : 'core',
                event  : 'modal.reply',
                err
            });

            this.#listening = false;

            this.end();
        });
    }

    parseResponse(interaction) {

        return this.componentIds.reduce((parsed, id) => {

            parsed[id] = interaction.fields.getTextInputValue(id) || undefined;

            return parsed;

        }, {});
    }

    end() {

        this.#id          = undefined;
        this.#client      = undefined;
        this.#interaction = undefined;
        this.#collector   = undefined;
        this.#options     = undefined;
        this.#listening   = undefined;
    }
}

module.exports = { InteractiveReply, PaginatedEmbeds, DashboardEmbeds, Modal };
