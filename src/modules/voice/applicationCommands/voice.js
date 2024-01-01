'use strict';

const { ApplicationCommand }  = require('../../../core');
const { PermissionFlagsBits } = require('discord.js');

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
                    create : { method : 'createHub', description : 'Create a new hub' }
                    // edit   : {
                    //     method      : 'editHub',
                    //     description : 'Edit an existing hub',
                    //     options     : {
                    //         id : {
                    //             type         : ApplicationCommand.SubTypes.String,
                    //             description  : 'Hub ID',
                    //             autocomplete : 'autocomplete',
                    //             required     : true
                    //         }
                    //     }
                    // },
                    // delete : {
                    //     method      : 'deleteHub',
                    //     description : 'Delete an existing hub',
                    //     options     : {
                    //         id : {
                    //             type         : ApplicationCommand.SubTypes.String,
                    //             description  : 'Hub ID',
                    //             autocomplete : 'autocomplete',
                    //             required     : true
                    //         }
                    //     }
                    // }
                }
            }
        };
    }

    listHub(interaction) {

        const { HubService } = this.services();


    }

    createHub(interaction) {

        const { HubView } = this.views();

        return HubView.createHub(interaction);
    }

    editHub(interaction) {

        const { HubService } = this.services();


    }

    deleteHub(interaction) {

        const { HubService } = this.services();


    }
};
