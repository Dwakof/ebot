'use strict';

// eslint-disable-next-line no-unused-vars
const { BaseInteraction, AutocompleteInteraction, BaseCommandInteraction, CommandInteraction, InteractionType } = require('discord.js');

const { AkairoHandler } = require('discord-akairo');

const Util = require('../../util');

const Interaction = require('./interaction');

class InteractionHandler extends AkairoHandler {

    /**
     * The Ebot client.
     * @type {EbotClient}
     */
    client;

    /**
     * @type {Map<String, Interaction>}
     */
    interactions;

    constructor(client) {

        super(client, { classToHandle : Interaction });

        this.client       = client;
        this.interactions = new Map();

        this.setup();
    }

    static get Events() {

        return {
            INTERACTION_STARTED   : 'interactionStarted',
            INTERACTION_FINISHED  : 'interactionFinished',
            INTERACTION_CANCELLED : 'interactionCancelled',
            ERROR                 : 'error'
        };
    }

    setup() {

        this.client.once('clientReady', () => {

            this.client.on('interactionCreate', (interaction) => {

                return this.handle(interaction);
            });
        });
    }

    // noinspection JSCheckFunctionSignatures
    /**
     * Registers a module.
     * @param {Interaction}  interaction          - Module to use.
     * @param {string}       [filepath]          - Filepath of module.
     *
     * @returns {void}
     */
    register(interaction, filepath) {

        super.register(interaction, filepath);

        for (const id of Object.keys(interaction.interactions)) {

            if (this.interactions.has(id)) {

                throw new Error(`An interaction with the ID ${ id } is already registered`);
            }

            this.interactions.set(id, interaction);
        }
    }



    /**
     * @param {BaseInteraction|AutocompleteInteraction|BaseCommandInteraction|CommandInteraction} interaction
     *
     * @return {Promise<void>}
     */
    async handle(interaction) {

        if (!interaction.customId) {

            return;
        }

        const interactionClass = this.interactions.get(interaction.customId);

        if (!interactionClass) {

            return;
        }

        try {

            await this.client.sentry.startSpan({
                op       : `interaction`,
                name     : `[${ this.client.util.capitalize(interactionClass.categoryID) }] ${ interaction.customId }`,
                metadata : {
                    method : 'INTERACTION'
                }
            }, async () => {

                const scope = this.client.sentry.getCurrentScope();

                scope.setContext('interaction', {
                    id        : interaction.id,
                    messageId : interaction.message?.id,
                    channelId : interaction.channelId,
                    guild     : interaction.member.guild.name,
                    guildId   : interaction.guildId
                });

                scope.setUser({
                    id       : interaction.user.id,
                    username : `${ interaction.user.username }#${ interaction.user.discriminator }`
                });

                this.emit(InteractionHandler.Events.INTERACTION_STARTED, interaction, interactionClass);

                const reply = await interactionClass.run(interaction.customId, interaction);

                if (reply instanceof Util.InteractiveReply || reply instanceof Util.Modal) {

                    await reply.send();
                }

                this.emit(InteractionHandler.Events.INTERACTION_FINISHED, interaction, interactionClass);
            });
        }
        catch (error) {

            this.emit(InteractionHandler.Events.ERROR, error, interaction, interactionClass);

            this.client.handleError(interactionClass, error);

            await this.client.util.send(interaction, 'Whoopsy, something went wrong with the command');
        }
    }
}

module.exports = InteractionHandler;
