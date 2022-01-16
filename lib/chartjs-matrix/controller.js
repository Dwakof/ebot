'use strict';

const { DatasetController } = require('chart.js');

const internals = {

    resolveX(anchorX, x, width) {

        if (anchorX === 'left' || anchorX === 'start') {
            return x;
        }

        if (anchorX === 'right' || anchorX === 'end') {
            return x - width;
        }

        return x - width / 2;
    },

    resolveY(anchorY, y, height) {

        if (anchorY === 'top' || anchorY === 'start') {
            return y;
        }

        if (anchorY === 'bottom' || anchorY === 'end') {
            return y - height;
        }

        return y - height / 2;
    }
};

class MatrixController extends DatasetController {

    initialize() {

        this.enableOptionSharing = true;
        super.initialize();
    }

    update(mode) {

        const meta = this._cachedMeta;

        this.updateElements(meta.data, 0, meta.data.length, mode);
    }

    updateElements(rects, start, count, mode) {

        const reset              = mode === 'reset';
        const { xScale, yScale } = this._cachedMeta;
        const firstOpts          = this.resolveDataElementOptions(start, mode);
        const sharedOptions      = this.getSharedOptions(mode, rects[start], firstOpts);

        for (let i = start; i < start + count; ++i) {

            const parsed                              = !reset && this.getParsed(i);
            const x                                   = reset ? xScale.getBasePixel() : xScale.getPixelForValue(parsed.x);
            const y                                   = reset ? yScale.getBasePixel() : yScale.getPixelForValue(parsed.y);
            const options                             = this.resolveDataElementOptions(i, mode);
            const { width, height, anchorX, anchorY } = options;
            const properties                          = {
                x : internals.resolveX(anchorX, x, width),
                y : internals.resolveY(anchorY, y, height),
                width, height, options
            };

            this.updateElement(rects[i], i, properties, mode);
        }

        this.updateSharedOptions(sharedOptions, mode);
    }

    draw() {

        const data = this.getMeta().data || [];

        let i;
        let ilen;

        for (i = 0, ilen = data.length; i < ilen; ++i) {

            data[i].draw(this._ctx);
        }
    }
}

MatrixController.id = 'matrix';

MatrixController.version = '1.1.1';

MatrixController.defaults = {
    dataElementType : 'matrix',

    animations : {
        numbers : {
            type       : 'number',
            properties : ['x', 'y', 'width', 'height']
        }
    },
    anchorX    : 'center',
    anchorY    : 'center'
};

MatrixController.overrides = {
    interaction : {
        mode      : 'nearest',
        intersect : true
    },

    scales : {
        x : {
            type   : 'linear',
            offset : true
        },
        y : {
            type    : 'linear',
            reverse : true
        }
    }
};

module.exports = MatrixController;
