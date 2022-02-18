'use strict';

const Hoek = require('@hapi/hoek');
const Got  = require('got');

const { MessageActionRow, MessageButton, Constants, Message, Interaction, MessageEmbed } = require('discord.js');

const internals = {
    defaults : {
        timeout : 120000,
        cache   : true,
        footer  : (page, index, total) => `Page ${ index + 1 } / ${ total }`,
        buttons : {
            previous : {
                label   : 'Previous',
                style   : Constants.MessageButtonStyles.SECONDARY,
                onReply : function (button) {

                    button.setDisabled(false);

                    if (this.index === 0) {

                        button.setDisabled(true);
                    }
                },
                onClick : function () {

                    this.index = Math.max(this.index - 1, 0);
                }
            },
            next     : {
                label   : 'Next',
                style   : Constants.MessageButtonStyles.SECONDARY,
                onReply : function (button) {

                    button.setDisabled(false);

                    if (this.length - 1 === this.index) {

                        button.setDisabled(true);
                    }
                },
                onClick : function () {

                    this.index = Math.min(this.length - 1, this.index + 1);
                }
            }
        }
    }
};

class PaginatedEmbeds {

    listening = false;
    ended     = false;

    #index = 0;
    #pages;

    #hooks = { onClick : {}, onReply : {}, label : {} };

    /**
     * @type {Map<String, MessageButton>}
     */
    #components = new Map();

    #cache = new Map();

    #options;
    #interaction;
    #reply;
    #collector;

    /**
     * @param {Message|Interaction} interaction
     * @param {Array<MessageEmbed|Function<MessageEmbed>|Promise<MessageEmbed>>} pages
     * @param {Object} options
     */
    constructor(interaction, pages, options = {}) {

        this.#options = Hoek.applyToDefaults(internals.defaults, options);

        this.#pages       = pages;
        this.#interaction = interaction;
    }

    get index() {

        return this.#index;
    }

    set index(value) {

        if (value > this.length - 1) {
            value = this.length - 1;
        }

        this.#index = value;
    }

    get length() {

        return this.#pages.length;
    }

    async getPage(index) {

        if (this.#options.cache && this.#cache.has(index)) {

            return { ...this.#cache.get(index), components : [new MessageActionRow({ components : Array.from(this.#components.values()) })] };
        }

        let page = this.#pages[index];

        if (page instanceof Promise) {

            page = await page;
        }

        if (typeof page === 'function') {

            page = await page(index);
        }

        if (page instanceof MessageEmbed) {

            page = { embeds : [page] };
        }

        if (Array.isArray(page)) {

            page = { embeds : page };
        }

        if (this.#options.footer) {

            for (const embed of page.embeds) {

                this.setFooter(embed);
            }
        }

        return { ...page, components : [new MessageActionRow({ components : Array.from(this.#components.values()) })] };
    }

    async send() {

        if (this.#interaction instanceof Interaction && !this.#interaction.deferred) {

            await this.#interaction.deferReply();
        }

        this.setupComponents();

        await this.reply();

        await this.setupCollector();

        return this;
    }

    _reply(payload) {

        if (this.#interaction instanceof Interaction) {

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

        const payload = await this.getPage(this.#index);

        this.#reply = await this._reply(payload);

        if (this.#options.cache) {

            this.#cache.set(this.#index, PaginatedEmbeds.serializeReply(this.#reply));
        }

        return this.#reply;
    }

    async end() {

        for (const component of this.#components.values()) {

            component.setDisabled(true);
        }

        try {

            this.#reply = await this.reply();

            return this.#reply;
        }
        catch (error) {

            if (error.httpStatus === 404) {

                return;
            }

            this.#interaction.client.handleError(error);
        }
        finally {

            this.#cache = null; // Might be useless but just in case

            this.ended = true;
        }
    }

    /**
     * @param {Object<{ embeds : Array<MessageEmbed>, attachments : Array }>|MessageEmbed} reply
     */
    setFooter(reply) {

        if (reply instanceof MessageEmbed) {

            reply.setFooter({ text : this.#options.footer(reply, this.index, this.length) });
        }
        else {

            reply.embeds.forEach((embed) => embed.setFooter({ text : this.#options.footer(reply, this.index, this.length) }));
        }
    }

    setupComponents() {

        this.#components = new Map();

        for (const [id, button] of Object.entries(this.#options.buttons)) {

            if (button) {

                let { label, style, disabled, onClick, onReply } = button;

                if (typeof embed === 'function') {

                    this.#hooks.label[id] = label.bind(this);

                    label = this.#hooks.label[id](this.index, this.length);
                }

                this.#components.set(id, new MessageButton({ customId : id, style, disabled, label }));

                if (typeof onReply === 'function') {

                    this.#hooks.onReply[id] = onReply.bind(this);

                    this.#hooks.onReply[id](this.#components.get(id), this.index, this.length);
                }

                if (typeof onClick === 'function') {

                    this.#hooks.onClick[id] = onClick.bind(this);
                }
            }
        }
    }

    async setupCollector() {

        if (!this.#reply) {

            throw new Error('Cannot setup collector without a reply');
        }

        this.#collector = await this.#reply.createMessageComponentCollector({
            filter : (interaction) => this.#components.has(interaction.customId),
            time   : this.#options.timeout
        });

        this.#collector.on('end', () => {

            this.listening = false;

            return this.end();
        });

        this.#collector.on('collect', async (interaction) => {

            await interaction.deferUpdate();

            if (this.#hooks.onClick[interaction.customId]) {

                this.#hooks.onClick[interaction.customId](this.#components.get(interaction.customId));
            }

            for (const [id, replyHook] of Object.entries(this.#hooks.onReply)) {

                replyHook(this.#components.get(id), this.index, this.length);
            }

            for (const [id, labelHook] of Object.entries(this.#hooks.label)) {

                this.#components.get(id).setLabel(labelHook(this.index, this.length));
            }

            await this.reply();

            return this.#collector.resetTimer();
        });

        this.listening = true;
    }

    static serializeReply({ embeds }) {

        return { embeds, files : [] };
    }
}

class DashboardPaginatedEmbeds extends PaginatedEmbeds {

    constructor(interaction, dashboards = [], options = {}) {

        const pages   = [];
        const buttons = { previous : false, next : false };

        for (const [index, { id, label, embed, style = {} }] of dashboards.entries()) {

            const { selected = Constants.MessageButtonStyles.PRIMARY, unselected = Constants.MessageButtonStyles.SECONDARY } = style;

            pages.push(embed);
            buttons[id] = {
                label,
                style   : unselected,
                onClick : function () {

                    this.index = index;
                },
                onReply : function (button) {

                    button.setDisabled(false);
                    button.setStyle(unselected);

                    if (index === this.index) {

                        button.setDisabled(true);
                        button.setStyle(selected);
                    }
                }
            };
        }

        super(interaction, pages, Hoek.applyToDefaults({ buttons, footer : false }, options));
    }
}

module.exports = { PaginatedEmbeds, DashboardPaginatedEmbeds };

