'use strict';

const Got = require('got');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed } = require('discord.js');

const { Service } = require('../../../core');

module.exports = class UrbanDictionaryService extends Service {

    #api;

    init() {

        this.#api = Got.extend({
            prefixUrl    : 'https://api.urbandictionary.com',
            responseType : 'json'
        });
    }

    /**
     * @typedef {Object} DefinitionObject
     *
     * @property {String} author
     * @property {String} word
     * @property {String} definition
     * @property {String} permalink
     * @property {Number} thumbs_up
     * @property {Number} thumbs_down
     */

    /**
     * @param {String} term
     *
     * @return {Promise<Array<DefinitionObject>|Boolean>}
     */
    async search(term) {

        const { body, statusCode } = await this.#api.get('v0/define', { searchParams : { term } });

        if (statusCode !== 200) {

            return false;
        }

        if (!Array.isArray(body?.list) || body?.list?.length <= 0) {

            return false;
        }

        return body.list.sort((one, two) => (two.thumbs_up - two.thumbs_down) - (one.thumbs_up - one.thumbs_down));
    }

    /**
     * @param {DefinitionObject} definition
     *
     * @return {MessageEmbed}
     */
    toEmbed(definition) {

        const cleanedUpDef = definition.definition.replace(/\[(.+?)]/g, (_, capture) => capture);

        return this.embed()
            .setURL(definition.permalink)
            .setTitle(definition.word)
            .setDescription(cleanedUpDef)
            .addFields([
                { name : 'Author', value : definition.author ?? '?', inline : true },
                { name : 'Thumbs up', value : definition.thumbs_up?.toString() ?? '?', inline : true },
                { name : 'Thumbs down', value : definition.thumbs_down?.toString() ?? '?', inline : true }
            ]);
    }

    /**
     * @return {MessageEmbed}
     */
    embed() {

        return this.client.util.embed()
            .setColor('#EFFF00')
            .setThumbnail('https://i.imgur.com/rMoErZd.png');
    }
};
