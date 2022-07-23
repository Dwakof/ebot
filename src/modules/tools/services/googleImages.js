'use strict';

// const Got = require('got');

// eslint-disable-next-line no-unused-vars
const { EmbedBuilder } = require('discord.js');

const { ServiceApi } = require('../../../core');

/**
 * @typedef {Object} ResultObject
 *
 * @property {String} title
 * @property {String} link
 * @property {String} displayLink
 * @property {ResultImageObject} image
 */

/**
 * @typedef {Object} ResultImageObject
 *
 * @property {String} contextLink
 * @property {Number} width
 * @property {Number} height
 * @property {Number} byteSize
 * @property {String} thumbnailLink
 * @property {Number} thumbnailWidth
 * @property {Number} thumbnailHeight
 */

module.exports = class GoogleImagesService extends ServiceApi {

    static ENDPOINT = 'https://www.googleapis.com';

    init() {

        super.init();

        this.defaultQueryParams = {
            key        : this.client.settings.plugins.tool.googleImages.apiKey,
            cx         : this.client.settings.plugins.tool.googleImages.engineId,
            searchType : 'image'
        };
    }

    /**
     * @param {String} query
     *
     * @return {Promise<Array<DefinitionObject>|Boolean>}
     */
    async search(query) {

        const { items } = await  this.api.get('/customsearch/v1', { q : query });

        if (!Array.isArray(items) || items?.length <= 0) {

            return false;
        }

        return items;
    }

    /**
     * @param {ResultObject} result
     *
     * @return {EmbedBuilder}
     */
    toEmbed(result) {

        return this.embed()
            .setURL(result.image.contextLink)
            .setTitle(result.title)
            .setImage(result.link);
    }

    /**
     * @return {EmbedBuilder}
     */
    embed() {

        return this.client.util.embed().setColor('#3A7AF2');
    }
};
