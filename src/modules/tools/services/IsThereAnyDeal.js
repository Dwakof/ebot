'use strict';

const Got = require('got');

// eslint-disable-next-line no-unused-vars
const { MessageEmbed } = require('discord.js');

const { Service } = require('../../../core');

/**
 * @typedef {Object} SearchResultObject
 *
 * @property {Number} id
 * @property {String} plain
 * @property {String} title
 */

/**
 * @typedef {Object} GameInfoObject
 *
 * @property {String} title
 * @property {String} image
 * @property {GameUrlsObject} urls
 */

/**
 * @typedef {Object} GameUrlsObject
 *
 * @property {String} game
 * @property {String} history
 * @property {String} package
 * @property {String} dlc
 */

/**
 * @typedef {Object} GamePriceOverviewObject
 *
 * @property {GamePriceObject} price
 * @property {GameLowestPriceObject} lowest
 */

/**
 * @typedef {Object} GamePriceObject
 *
 * @property {String} store
 * @property {Number} cut
 * @property {Number} price
 * @property {String} price_formatted
 * @property {String} url
 */

/**
 * @typedef {Object} GameLowestPriceObject
 *
 * @property {String} store
 * @property {Number} cut
 * @property {Number} price
 * @property {String} price_formatted
 * @property {String} url
 * @property {Number} recorded
 * @property {String} recorded_formatted
 */

/**
 * @typedef {Object} GameResultObject
 *
 * @property {GameInfoObject} info
 * @property {GamePriceOverviewObject} overview
 */

module.exports = class IsThereAnyDealService extends Service {

    #api;

    init() {
        this.#api = Got.extend({ 
            prefixUrl: 'https://api.isthereanydeal.com', 
            responseType : 'json',
            searchParams : {
                'key':  this.client.settings.plugins.tool.isthereanydeal.apiKey,
            },
        });
    }

    /**
     * @param {String} query
     *
     * @return {Promise<Array<SearchResultObject>|Boolean>}
     */
    async search(query) {
        const { body, statusCode } = await this.#api.get('v02/search/search', {
            searchParams : { 
                'limit': 100,
                'q': query,
            },
        });

        if (statusCode !== 200) {
            return false;
        }

        const results = body?.data?.results;

        if (!Array.isArray(results) || results.length <= 0) {
            return false;
        }

        return results;
    }

    /**
     * @param {SearchResultObject} result
     *
     * @return {Promise<Array<GameResultObject>>}
     */
    async getInfo(result) {
        const identifier = result.plain;

        // Get Game Info (title, image, etc.)
        const { body: gameInfoBody } = await this.#api.get('v01/game/info', {
            searchParams : { 'plains': identifier },
        });
        const info = gameInfoBody.data[identifier];

        // Get price overview
        const { body: overviewBody } = await this.#api.get('v01/game/overview', {
            searchParams : { 'plains': identifier },
        });
        const overview = overviewBody.data[identifier];

        return { info, overview };
    }

    /**
     * @param {GameResultObject} game
     *
     * @return {MessageEmbed}
     */
    resultEmbed(game) {
        const info = game.info;
        const overview = game.overview;

        const current = {
            store: overview?.price?.store ? `(${overview.price.store})` : '',
            price: overview?.price?.price_formatted ?? '?',
        };
        const lowest = {
            store: overview?.lowest?.store ? `(${overview.lowest.store})` : '',
            price: overview?.lowest?.price_formatted ?? '?',
        };

        return this.baseEmbed()
            .setURL(info?.urls?.game)
            .setTitle(info?.title ?? '?')
            .setImage(info?.image)
            .addFields([
                { name: 'Price', value: `${current.price} ${current.store}`, inline: true },
                { name: 'Lowest ever', value: `${lowest.price} ${lowest.store}`, inline: true },
            ]);
    }

    /**
     * @param {String} title
     * @param {String} message
     *
     * @return {MessageEmbed}
     */
    messageEmbed(title, message) {
        const embed = this.baseEmbed()
        if (title) {
            embed.setTitle(title)
        }
        return embed.setDescription(message);
    }

    /**
     * @return {MessageEmbed}
     */
    baseEmbed() {
        return this.client.util.embed()
            .setColor('#046eb2')
            .setThumbnail('https://i.imgur.com/xx7rLfE.jpg');
    }
};
