'use strict';

const { PermissionFlagsBits, channelMention } = require('discord.js');
const Lunr                                    = require('lunr');

const { ApplicationCommand } = require('../../../core');

module.exports = class Voice extends ApplicationCommand {

    constructor() {

        super('voice', {
            global        : false,
            directMessage : false,
            category      : 'voice',
            description   : 'Manage Hubs and temporary voice channels',
            permissions   : PermissionFlagsBits.Administrator
        });
    }

    static get subgroups() {

        return {
            hub : {
                description : 'Manage Hubs',
                subcommands : {
                    // list   : { method : 'listHub', description : 'List all hubs' },
                    create : {
                        method      : 'createHub',
                        description : 'Create a new hub',
                        options     : {
                            name           : {
                                description : 'Hub name',
                                type        : ApplicationCommand.SubTypes.String,
                                required    : true
                            },
                            'default-size' : {
                                description : 'Default size of the temporary channels',
                                type        : ApplicationCommand.SubTypes.Integer,
                                required    : false,
                                min         : 0,
                                max         : 99
                            },
                            'default-type' : {
                                description : 'Default visibility of the temporary channels',
                                type        : ApplicationCommand.SubTypes.String,
                                required    : false,
                                choices     : {
                                    'Public'  : 'public',
                                    'Inherit' : 'inherit',
                                    'Locked'  : 'locked',
                                    'Private' : 'private'
                                }
                            }
                        }
                    },
                    edit   : {
                        method      : 'editHub',
                        description : 'Edit an existing hub',
                        options     : {
                            hub : {
                                description  : 'Hub',
                                type         : ApplicationCommand.SubTypes.String,
                                autocomplete : 'autocompleteHub',
                                required     : true
                            }
                        }
                    },
                    delete : {
                        method      : 'deleteHub',
                        description : 'Delete an existing hub',
                        options     : {
                            hub : {
                                description  : 'Hub',
                                type         : ApplicationCommand.SubTypes.String,
                                autocomplete : 'autocompleteHub',
                                required     : true
                            }
                        }
                    }
                }
            }
        };
    }

    /**
     * @param {import('discord.js').AutocompleteInteraction} interaction
     * @param {string}                                       hub
     */
    async autocompleteHub(interaction, { hub }) {

        const { HubService } = this.services();

        const { index, channels } = await HubService.buildAutoComplete(interaction.guild);

        if (hub.length === 0) {

            return interaction.respond(
                channels.slice(0, 25)
                    .map(({ name, parent, id }) => ({ name : `${ parent.name } - ${ name }`, value : id }))
            );
        }

        const results = index.query((q) => {

            q.term(hub, { boost : 3 });
            q.term(hub, { boost : 2, wildcard : Lunr.Query.wildcard.TRAILING });
            q.term(hub, { boost : 1, editDistance : 1 });
        });

        return interaction.respond(results.map(({ ref }) => {

            const channel = channels.find((c) => c.id === ref);

            return { name : `${ channel.parent.name } - ${ channel.name }`, value : ref };
        }));
    }

    async createHub(interaction, { name, 'default-size' : defaultSize = 10, 'default-type' : defaultType = 'inherit' }) {

        const { HubService } = this.services();

        const hub = await HubService.createHub(interaction.guild, name, { defaultSize, defaultType });

        return interaction.reply({ content : `Channel ${ channelMention(hub.channel.id) } created ✅`, ephemeral : true });
    }

    /**
     * @param {import('discord.js').ApplicationCommandInteraction} interaction
     * @param {string} hub
     */
    async editHub(interaction, { hub : hubId }) {

        const { HubService } = this.services();
        const { HubView }    = this.views();

        const hub = await HubService.getHub(interaction.guild.id, hubId);

        if (!hub) {

            return interaction.reply({ content : `Hub ${ hubId } not found ❌`, ephemeral : true });
        }

        return interaction.reply(HubView.editHub(hub));
    }

    /**
     * @param {import('discord.js').ApplicationCommandInteraction} interaction
     * @param {string} hub
     */
    async deleteHub(interaction, { hub : hubId }) {

        const { HubService } = this.services();

        const hub = await HubService.getHub(interaction.guild.id, hubId);

        if (!hub) {

            return interaction.reply({ content : `Hub ${ hubId } not found ❌`, ephemeral : true });
        }

        const name = hub.channel.name;

        await HubService.deleteHub(hub);

        return interaction.reply({ content : `Hub "${ name }" deleted ✅`, ephemeral : true });
    }
};
