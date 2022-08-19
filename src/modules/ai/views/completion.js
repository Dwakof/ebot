'use strict';

// eslint-disable-next-line no-unused-vars
const { Formatters, TextInputStyle, EmbedBuilder, BaseInteraction, ButtonStyle } = require('discord.js');

const { View, Util } = require('../../../core');

module.exports = class CompletionView extends View {

    /**
     * @param {BaseInteraction}              interaction
     * @param {String}                       prompt
     * @param {CharacterService~Character[]} characters
     * @param {Object}                       [options]
     *
     * @return {EmbedBuilder}
     */
    promptEmbed(interaction, prompt, characters, options) {

        return this.embed()
            .setAuthor({
                name    : `OpenAI x ${ interaction?.member?.nickname || interaction?.user?.username }`,
                iconURL : interaction?.member?.avatarURL?.({ dynamic : true }) || interaction?.user?.avatarURL?.({ dynamic : true })
            })
            .addFields([
                { name : 'Prompt', value : Formatters.blockQuote(prompt), inline : false },
                { name : 'Peoples', value : characters.map(({ name }) => name).join(', ') || Formatters.inlineCode('none'), inline : false }
            ]);
    }

    /**
     * @param {BaseInteraction}                                  interaction
     * @param {String}                                           prompt
     * @param {CharacterService~Character[]}                     characters
     * @param {{tokens: number, text : string, price : string}}  response
     * @param {Object}                                           [options]
     *
     * @return {EmbedBuilder}
     */
    completionEmbed(interaction, prompt, characters, { text, tokens, price }, options) {

        const embed = this.promptEmbed(interaction, prompt, characters, options);

        const elements = [
            `${ tokens } tokens`,
            `${ price }`
        ];

        if (options.model) {

            elements.push(options.model);
        }

        if (options.temperature) {

            elements.push(`temperature ${ options.temperature }`);
        }

        embed.setFooter({
            iconURL : 'https://nextgrid.ai/wp-content/uploads/2021/04/openai-icon-cut-1-1024x1024.png',
            text    : elements.join(' | ')
        });

        const blocks = this.parseReply(text);

        embed.addFields([{ name : 'Result', value : Formatters.blockQuote(blocks.shift().trim()), inline : false }]);
        embed.addFields(blocks.map((block) => ({ name : Util.BLANK_CHAR, value : Formatters.blockQuote(block.trim()), input : false })));

        return embed;
    }

    /**
     * @param {String} text
     *
     * @return {String[]}
     */
    parseReply(text) {

        let result = text.trim();

        if (new RegExp(/(INT\. |EXT\. |INT\/EXT\. |EXT\/INT\. )/gm).test(result)) {

            // screenplay mode yay, I hate you OpenAI

            for (const [, match] of result.matchAll(/((INT\. |EXT\. |INT\/EXT\. |EXT\/INT\. )[A-Z \-'()]+) [A-Z][a-z]/gm)) {

                result = result.replace(match, `\n${ Formatters.inlineCode(match) }\n`);
            }

            for (const [match, before, name, after] of result.matchAll(/[.?!] ([A-Z]{2}[A-Z. \-'()]+) [A-Z0-9][a-z.]/gm)) {

                result = result.replace(match, `${ before }\n${ Formatters.bold(name) } : ${ after }`);
            }
        }

        return result.split('\n').reduce((acc, block) => {

            if (acc[acc.length - 1].length + block.length > 1000) {

                acc.push('');
            }

            if (block.length > 1000) {

                for (const sentence of block.split('.')) {

                    if (acc[acc.length - 1].length + sentence.length > 1000) {

                        acc.push('');
                    }

                    acc[acc.length - 1] = acc[acc.length - 1].concat('.', block);
                }

                return acc;
            }

            acc[acc.length - 1] = acc[acc.length - 1].concat('\n', block);

            return acc;

        }, ['']);
    }

    /**
     * @param {BaseInteraction} interaction
     * @param {Object}          options
     *
     * @return {Modal}
     */
    async promptModal(interaction, options) {

        const { CharacterService } = this.services();

        /**
         * @type {CharacterService~Character[]}
         */
        let characters = await this.store.list('character', interaction.guildId);

        characters = characters.map(({ value }) => value);

        return new Util.Modal(interaction, {
            title      : `You story prompt`,
            components : [
                {
                    id          : 'prompt',
                    label       : 'Prompt',
                    placeholder : 'Write a story about a licorne riding an horse',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Paragraph,
                    max_length  : 1000,
                    required    : true
                }
            ],
            reply      : async (modalInteraction, { prompt }) => {

                const selected = CharacterService.findInText(prompt, characters);

                return await new PromptActionMessage(modalInteraction, { selected, characters, prompt, options }).send();
            }
        });
    }
};

class PromptActionMessage extends Util.InteractiveReply {

    #prompt;
    #characters;
    #selected;
    #options;
    #response;

    running  = false;
    followUp = false;

    /**
     * @param {BaseInteraction}              interaction
     * @param {String}                       prompt
     * @param {CharacterService~Character[]} characters
     * @param {String[]}                     selected
     * @param {Object}                       options
     */
    constructor(interaction, { prompt, characters, selected, options = {} }) {

        super(interaction, {
            ephemeral  : true,
            components : [
                {
                    id          : 'addCharacters',
                    type        : Util.InteractiveReply.InputType.Select,
                    placeholder : 'Select additional characters',
                    hide        : () => this.running,
                    onReply     : (select) => {

                        const opt = this.#characters
                            .filter(({ id }) => !this.#selected.includes(id))
                            .map(({ name, id, description }) => ({ label : name, value : id, description }));

                        if (opt.length === 0) {

                            return select.setDisabled(true).setOptions([{ label : 'none', value : 'none' }]).setMaxValues(1);
                        }

                        select.setDisabled(false).setOptions(opt).setMaxValues(opt.length);
                    },
                    onAction    : (select, { values }) => {

                        this.#selected.push(...values);
                    }
                },
                {
                    id          : 'removePeoples',
                    type        : Util.InteractiveReply.InputType.Select,
                    placeholder : 'Select characters to remove',
                    hide        : () => this.running,
                    onReply     : (select) => {

                        const opt = this.characters.map(({ name, id, description }) => ({ label : name, value : id, description }));

                        if (opt.length === 0) {

                            return select.setDisabled(true).setOptions([{ label : 'none', value : 'none' }]).setMaxValues(1);
                        }

                        select.setDisabled(false).setOptions(opt).setMaxValues(opt.length);
                    },
                    onAction    : (select, { values }) => {

                        this.#selected = this.#selected.filter((character) => !values.includes(character));
                    }
                },
                {
                    id       : 'run',
                    type     : Util.InteractiveReply.InputType.Button,
                    style    : ButtonStyle.Primary,
                    label    : () => (this.running ? 'Executing...' : 'Run the prompt'),
                    onAction : async (button, buttonInteraction) => {

                        if (this.running) {

                            return;
                        }

                        button.setDisabled(true);

                        this.running = true;

                        await buttonInteraction.deferUpdate({ ephemeral : true });

                        await this.reply();

                        const { GPT3Service } = this.client.services('ai');

                        this.#response = await GPT3Service.completion(this.#prompt, this.#options.model, this.characters, this.#options);

                        return this.end();
                    }
                }
            ]
        });

        this.#prompt     = prompt;
        this.#characters = characters;
        this.#selected   = selected;
        this.#options    = options;
    }

    build() {

        const { CompletionView } = this.client.views('ai');

        if (this.#response) {

            const followUp = this.ending && !this.followUp;

            this.followUp = true;

            return {
                embeds    : [CompletionView.completionEmbed(this.interaction, this.#prompt, this.characters, this.#response, this.#options)],
                ephemeral : !this.running,
                followUp
            };
        }

        return {
            embeds    : [CompletionView.promptEmbed(this.interaction, this.#prompt, this.characters, this.#options)],
            ephemeral : true
        };
    }

    async reply() {

        const reply = await super.reply();

        if (this.#response && !reply.interaction) {

            const { PromptService } = this.client.services('ai');

            await PromptService.save(reply.guildId, reply.id, this.#response);
        }

        return reply;
    }

    get characters() {

        return this.#characters.filter(({ id }) => this.#selected.includes(id));
    }
}
