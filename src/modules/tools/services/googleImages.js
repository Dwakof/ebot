'use strict';

const Got = require('got');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed } = require('discord.js');

const { Service } = require('../../../core');

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

module.exports = class GoogleImagesService extends Service {

    #api;

    init() {
        this.#api = Got.extend({
            prefixUrl: 'https://www.googleapis.com',
        });
    }
    /**
     * @param {String} query
     *
     * @return {Promise<Array<DefinitionObject>|Boolean>}
     */
    async search(query) {

        const { body, statusCode } = await this.#api.get('customsearch/v1', {
            searchParams : { 
                key: this.client.settings.plugins.googleImages.apiKey,
                cx: this.client.settings.plugins.googleImages.engineId,
                q: query,
                searchType: 'image',
                filter: 1,
            }
        });

        if (statusCode !== 200) {
            return false;
        }

        const jsonBody = JSON.parse(body);

        if (!Array.isArray(jsonBody?.items) || jsonBody?.items?.length <= 0) {
            return false;
        }

        return jsonBody.items;
    }

    /**
     * @param {ResultObject} result
     *
     * @return {MessageEmbed}
     */
    toEmbed(result) {
        return this.embed()
            .setURL(result.image.contextLink)
            .setTitle(result.title)
            .setImage(result.link);
    }

    /**
     * @return {MessageEmbed}
     */
    embed() {
        return this.client.util.embed().setColor('#3A7AF2');
    }
};