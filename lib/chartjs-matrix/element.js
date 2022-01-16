'use strict';

const { Element }                                     = require('chart.js');
const { isObject, addRoundedRectPath, toTRBLCorners } = require('chart.js/helpers');

const internals = {

    /**
     * Helper function to get the bounds of the rect
     * @param {MatrixElement} rect the rect
     * @param {boolean} [useFinalPosition]
     * @return {object} bounds of the rect
     * @private
     */
    getBounds(rect, useFinalPosition) {

        const { x, y, width, height } = rect.getProps(['x', 'y', 'width', 'height'], useFinalPosition);
        return { left : x, top : y, right : x + width, bottom : y + height };
    },

    limit(value, min, max) {

        return Math.max(Math.min(value, max), min);
    },

    parseBorderWidth(rect, maxW, maxH) {

        const value = rect.options.borderWidth;

        let b;
        let l;
        let r;
        let t;

        if (isObject(value)) {
            t = +value.top || 0;
            r = +value.right || 0;
            b = +value.bottom || 0;
            l = +value.left || 0;
        }
        else {
            t = r = b = l = +value || 0;
        }

        return {
            t : internals.limit(t, 0, maxH),
            r : internals.limit(r, 0, maxW),
            b : internals.limit(b, 0, maxH),
            l : internals.limit(l, 0, maxW)
        };
    },

    boundingRects(rect) {

        const bounds = internals.getBounds(rect);
        const width  = bounds.right - bounds.left;
        const height = bounds.bottom - bounds.top;
        const border = internals.parseBorderWidth(rect, width / 2, height / 2);

        return {
            outer : {
                x : bounds.left,
                y : bounds.top,
                w : width,
                h : height
            },
            inner : {
                x : bounds.left + border.l,
                y : bounds.top + border.t,
                w : width - border.l - border.r,
                h : height - border.t - border.b
            }
        };
    },

    inRange(rect, x, y, useFinalPosition) {

        const skipX  = x === null;
        const skipY  = y === null;
        const bounds = !rect || (skipX && skipY) ? false : internals.getBounds(rect, useFinalPosition);

        return bounds
            && (skipX || x >= bounds.left && x <= bounds.right)
            && (skipY || y >= bounds.top && y <= bounds.bottom);
    }
};

class MatrixElement extends Element {

    constructor(cfg) {

        super();

        this.options = undefined;
        this.width   = undefined;
        this.height  = undefined;

        if (cfg) {
            Object.assign(this, cfg);
        }
    }

    draw(ctx) {

        const options          = this.options;
        const { inner, outer } = internals.boundingRects(this);
        const radius           = toTRBLCorners(options.borderRadius);

        ctx.save();

        if (outer.w !== inner.w || outer.h !== inner.h) {
            ctx.beginPath();
            addRoundedRectPath(ctx, { x : outer.x, y : outer.y, w : outer.w, h : outer.h, radius });
            addRoundedRectPath(ctx, { x : inner.x, y : inner.y, w : inner.w, h : inner.h, radius });
            ctx.fillStyle = options.backgroundColor;
            ctx.fill();
            ctx.fillStyle = options.borderColor;
            ctx.fill('evenodd');
        }
        else {
            ctx.beginPath();
            addRoundedRectPath(ctx, { x : inner.x, y : inner.y, w : inner.w, h : inner.h, radius });
            ctx.fillStyle = options.backgroundColor;
            ctx.fill();
        }

        ctx.restore();
    }

    inRange(mouseX, mouseY, useFinalPosition) {

        return internals.inRange(this, mouseX, mouseY, useFinalPosition);
    }

    inXRange(mouseX, useFinalPosition) {

        return internals.inRange(this, mouseX, null, useFinalPosition);
    }

    inYRange(mouseY, useFinalPosition) {

        return internals.inRange(this, null, mouseY, useFinalPosition);
    }

    getCenterPoint(useFinalPosition) {

        const { x, y, width, height } = this.getProps(['x', 'y', 'width', 'height'], useFinalPosition);

        return {
            x : x + width / 2,
            y : y + height / 2
        };
    }

    tooltipPosition() {

        return this.getCenterPoint();
    }

    getRange(axis) {

        return axis === 'x' ? this.width / 2 : this.height / 2;
    }
}

MatrixElement.id       = 'matrix';

MatrixElement.defaults = {
    backgroundColor : undefined,
    borderColor     : undefined,
    borderWidth     : undefined,
    borderRadius    : 0,
    anchorX         : undefined,
    anchorY         : undefined,
    width           : 20,
    height          : 20
};

module.exports = MatrixElement;
