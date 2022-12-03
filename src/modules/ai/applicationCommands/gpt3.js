'use strict';

const { ApplicationCommand, Util } = require('../../../core');

module.exports = class GPT3Command extends ApplicationCommand {

    constructor() {

        super('gpt3', { description : `Commands to create characters and generate some text using OpenAI GPT-3 AI` });
    }

    static get subgroups() {

        return {
            character   : {
                description : 'Create/Edit character with their backstory',
                subcommands : {
                    list   : {
                        method      : 'list',
                        description : 'List all the characters'
                    },
                    create : {
                        method      : 'create',
                        description : 'Create a new character',
                        options     : {
                            id : {
                                type        : ApplicationCommand.SubTypes.String,
                                description : 'Character ID',
                                required    : true
                            }
                        }
                    },
                    edit   : {
                        method      : 'edit',
                        description : 'Edit an existing character',
                        options     : {
                            id : {
                                type         : ApplicationCommand.SubTypes.String,
                                description  : 'Character ID',
                                autocomplete : 'autocomplete',
                                required     : true
                            }
                        }
                    },
                    delete : {
                        method      : 'delete',
                        description : 'Delete an existing character',
                        options     : {
                            id : {
                                type         : ApplicationCommand.SubTypes.String,
                                description  : 'Character ID',
                                autocomplete : 'autocomplete',
                                required     : true
                            }
                        }
                    }
                }
            },
            completions : {
                method      : 'completion',
                description : `Generate some text using OpenAI's GPT-3 AI`,
                options     : {
                    model       : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'OpenAI Model to use',
                        required    : false,
                        default     : 'text-curie-001',
                        choices     : {
                            'Davinci' : 'text-davinci-003',
                            'Curie'   : 'text-curie-001',
                            'Babbage' : 'text-babbage-001',
                            'Ada'     : 'text-ada-001'
                        }
                    },
                    temperature : {
                        type        : ApplicationCommand.SubTypes.Number,
                        description : 'Higher values means the AI will take more risks. 0.9 for more creative applications',
                        required    : false,
                        default     : 0.9,
                        max_value   : 2,
                        min_value   : 0
                    }
                }
            }
        };
    }

    async list(interaction) {

        const { CharacterView } = this.views();

        const characters = await this.store.list('character', interaction.guildId);

        return CharacterView.listCharacters(interaction, characters.map(({ value }) => value));
    }

    async create(interaction, { id }) {

        const existing = await this.store.get('character', interaction.guildId, id);

        if (existing) {

            await this.client.util.send(interaction, { content : 'This character already exists', ephemeral : true });
        }

        const { CharacterView } = this.views();

        return CharacterView.editCharacterModal(interaction, { id, name : Util.capitalize(id) });
    }

    async edit(interaction, { id }) {

        const character = await this.store.get('character', interaction.guildId, id);

        if (!character) {

            await this.client.util.send(interaction, { content : 'This character does not exists', ephemeral : true });
        }

        const { CharacterView } = this.views();

        return CharacterView.editCharacterModal(interaction, character.value);
    }

    async delete(interaction, { id }) {

        const character = await this.store.get('character', interaction.guildId, id);

        if (!character) {

            await this.client.util.send(interaction, { content : 'This character does not exists', ephemeral : true });
        }

        await this.store.delete('character', interaction.guildId, id);

        return this.client.util.send(interaction, { content : `Character ${ character.value.name } (${ id }) deleted` });
    }

    async autocomplete(interaction, { id : query = '' }) {

        const { CharacterService } = this.services();

        const characters = await CharacterService.autocomplete(interaction.guildId, query);

        if (characters.length === 0) {

            return interaction.respond([{ name : 'No result found', value : query }]);
        }

        const list = characters.map(({ id, name }) => ({ name, value : id }));

        list[0].focused = true;

        return interaction.respond(list);
    }

    async completion(interaction, { model, temperature }) {

        const { CompletionView } = this.views();

        try {

            return CompletionView.promptModal(interaction, { model, temperature, user : interaction.userId });
        }
        catch (error) {

            await this.client.util.send(interaction, 'Something went wrong');

            this.client.handleError(this, error, interaction);
        }
    }
};
