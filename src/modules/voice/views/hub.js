'use strict';

const { TextInputStyle, channelMention } = require('discord.js');

const { View, Util } = require('../../../core');

class HubView extends View {

    createHub(interaction) {

        return new Util.Modal(interaction, {
            title      : `Creating a hub`,
            components : [
                {
                    id          : 'name',
                    label       : 'Name',
                    placeholder : 'Your Hub name',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    max_length  : 100,
                    required    : true,
                    value       : 'Cool hub name'
                },
                {
                    id          : 'defaultSizeString',
                    label       : 'Channel default size',
                    placeholder : 'Default size of the temporary channels',
                    type        : Util.Modal.InputType.Text,
                    style       : TextInputStyle.Short,
                    min_length  : 1,
                    max_length  : 3,
                    required    : true,
                    value       : '10'
                },
                {
                    id          : 'defaultType',
                    label       : 'Channel default visibility',
                    placeholder : 'Default size of the temporary channels',
                    type        : Util.Modal.InputType.Select,
                    style       : TextInputStyle.Short,
                    required    : true,
                    value       : 'public'
                }
            ],
            reply      : async (modalInteraction, { name, defaultSizeString, defaultType }) => {

                const defaultSize = parseInt(defaultSizeString, 10);

                if (isNaN(defaultSize) || defaultSize < 1 || defaultSize > 99) {

                    return await modalInteraction.reply({ content : 'Invalid default size must be between 1 and 99', ephemeral : true });
                }

                const { HubService } = this.services();

                const hub = await HubService.createHub(modalInteraction.guild, { name, defaultSize, defaultType });

                await modalInteraction.reply({ content : `Channel ${ channelMention(hub.id) } created`, ephemeral : true });
            }
        });
    }

}

module.exports = HubView;
