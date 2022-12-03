'use strict';

// eslint-disable-next-line no-unused-vars
const { TextInputStyle, EmbedBuilder, BaseInteraction, ButtonStyle } = require('discord.js');

const { View, Util } = require('../../../core');

module.exports = class CharacterView extends View {

    /**
     * @param {CharacterService~Character} character
     *
     * @return {EmbedBuilder}
     */
    characterEmbed(character) {

        return this.embed()
            .setTitle(`Character ${ character.name }`)
            .addFields([
                { name : 'ID', value : Util.inlineCode(character.id), inline : true },
                { name : 'Gender', value : character.gender ?? Util.inlineCode('Unknown'), inline : true },
                { name : 'Age', value : character.age ?? Util.inlineCode('Unknown'), inline : true },
                { name : 'Description', value : character.description ?? Util.inlineCode('Unknown'), inline : false },
                { name : 'Story', value : character.story ? Util.blockQuote(character.story) : Util.inlineCode('Unknown'), inline : false }
            ]);
    }

    /**
     * @param {Message|BaseInteraction}    interaction
     * @param {CharacterService~Character} character
     *
     * @return {Modal}
     */
    editCharacterModal(interaction, character) {

        return new Util.Modal(interaction, {
            title      : `Editing character ${ character.name || character.id }`,
            components : [
                {
                    id          : 'name',
                    label       : 'Name',
                    placeholder : 'Your character name',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    max_length  : 100,
                    required    : true,
                    value       : character.name
                },
                {
                    id          : 'gender',
                    label       : 'Gender',
                    placeholder : 'Your character gender (male/female/...)',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    max_length  : 50,
                    required    : false,
                    value       : character.gender
                },
                {
                    id          : 'age',
                    label       : 'Age',
                    placeholder : 'Your character age (3 month old, 5 years old, very old)',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    max_length  : 50,
                    required    : false,
                    value       : character.age
                },
                {
                    id          : 'description',
                    label       : 'Description',
                    placeholder : 'A short description of your character',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    max_length  : 100,
                    required    : false,
                    value       : character.description
                },
                {
                    id          : 'story',
                    label       : 'Story',
                    placeholder : 'Your character backstory',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Paragraph,
                    max_length  : 1000,
                    required    : true,
                    value       : character.story
                }
            ],
            reply      : async (modalInteraction, { name, gender, age, description, story }) => {

                const { value } = await this.store.set('character', interaction.guildId, character.id, {
                    ...character, name, gender, age, description, story
                });

                await modalInteraction.reply({ embeds : [this.characterEmbed(value)] });
            }
        });
    }

    /**
     * @param {Message|BaseInteraction}      interaction
     * @param {CharacterService~Character[]} characters
     *
     * @return {PaginatedEmbeds}
     */
    listCharacters(interaction, characters) {

        const embeds = characters.map(({ id }) => {

            return async () => {

                const { value } = await this.store.get('character', interaction.guildId, id);

                return this.characterEmbed(value);
            };
        });

        return new Util.PaginatedEmbeds(interaction, embeds, {
            cache      : false,
            components : [
                {
                    id       : 'previous',
                    label    : 'Previous',
                    type     : Util.PaginatedEmbeds.InputType.Button,
                    style    : ButtonStyle.Secondary,
                    onReply  : function (button) {

                        button.setDisabled(false);

                        if (this.index === 0) {

                            button.setDisabled(true);
                        }
                    },
                    onAction : function () {

                        this.index = Math.max(this.index - 1, 0);
                    }
                },
                {
                    id       : 'edit',
                    label    : 'Edit',
                    emoji    : { name : '✏' },
                    type     : Util.PaginatedEmbeds.InputType.Button,
                    style    : ButtonStyle.Secondary,
                    onAction : (_, editInteraction, index) => {

                        return this.editCharacterModal(editInteraction, characters[index]).send();
                    }
                },
                {
                    id       : 'next',
                    label    : 'Next',
                    type     : Util.PaginatedEmbeds.InputType.Button,
                    style    : ButtonStyle.Secondary,
                    onReply  : function (button) {

                        button.setDisabled(false);

                        if (this.length - 1 === this.index) {

                            button.setDisabled(true);
                        }
                    },
                    onAction : function () {

                        this.index = Math.min(this.length - 1, this.index + 1);
                    }
                }
            ]
        });
    }
};
