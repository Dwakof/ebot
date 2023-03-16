'use strict';

const Canvas = require('@napi-rs/canvas');

const { Service } = require('../../../core');

module.exports = class CanvasService extends Service {

    /**
     * @param {number} width
     * @param {number} height
     *
     * @return {CanvasObject}
     */
    getCanvas(width, height) {

        return Canvas.createCanvas(width, height);
    }

    /**
     * @param {CanvasObject} canvas
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @return {Promise<Buffer>}
     */
    toBuffer(canvas, format = 'webp', options = null) {

        return canvas.encode(format, options);
    }

    /**
     * @param {CanvasObject} canvas
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @return {Buffer}
     */
    toBufferSync(canvas, format = 'webp', options = null) {

        return canvas.toBuffer(`image/${ format }`, options);
    }

    /**
     * @param {CanvasObject} canvas
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @return {Promise<string>}
     */
    toDataURL(canvas, format = 'webp', options = null) {

        return canvas.toDataURLAsync(`image/${ format }`, options);
    }

    /**
     * @param {CanvasObject} canvas
     * @param {ImageFormat}  [format=webp]
     * @param {ImageOptions} [options]
     *
     * @return {string}
     */
    toDataURLSync(canvas, format = 'webp', options = null) {

        return canvas.toDataURL(`image/${ format }`, options);
    }
};

/**
 * @typedef {'png'|'jpg'|'webp'|'avif'} ImageFormat
 */

/**
 * @typedef {Canvas.AvifConfig|number} ImageOptions
 */

/**
 * @typedef {Canvas} CanvasObject
 */
