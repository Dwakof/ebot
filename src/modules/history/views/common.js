'use strict';

const { View, Util } = require('../../../core');

module.exports = class CommonView extends View {

    displayEmoji(emoji) {

        return emoji.indexOf(':') !== -1 ? `<${ emoji }>` : emoji;
    }

    multiColumnSingleFullWidthField(embed, values, title = 'Title', options = {}) {

        const { row = 3, column = 4, callback, emptyValueCallback = () => '⠀⠀⠀⠀' } = options;

        const chunk = Util.chunk(values, row);

        const lines = [];

        for (let i = 0; i < row; ++i) {

            const cells = [];

            for (let j = 0; j < column; ++j) {

                const value = (chunk[j] || [])[i];

                if (!value) {

                    cells.push(emptyValueCallback());
                    continue;
                }

                cells.push(callback(value, chunk[j], column, row));
            }

            lines.push(cells.join('⠀⠀'));
        }

        embed.addField(title, lines.join('\n'), false);

        return embed;
    }

    multiColumnSingleField(embed, values, title = 'Title', options = {}) {

        const { row = 3, column = 2, callback, emptyValueCallback = () => '⠀⠀⠀⠀' } = options;

        const chunk = Util.chunk(values, Math.ceil(values.length / column));

        const lines = [];

        for (let i = 0; i < row; ++i) {

            const cells = [];

            for (let j = 0; j < column; ++j) {

                const value = (chunk[j] || [])[i];

                if (!value) {

                    cells.push(emptyValueCallback());
                    continue;
                }

                cells.push(callback(value, chunk[j], j, i));
            }

            lines.push(cells.join('⠀⠀'));
        }

        embed.addField(title, lines.join('\n') || Util.BLANK_CHAR, true);

        return embed;
    }

    twoColumnSplitMiddle(embed, values, title = 'Title', options = {}) {

        const { callback } = options;

        const [columns1, columns2 = []] = Util.chunk(values, Math.ceil(values.length / 2));

        let lines = [];

        for (const [i, value] of columns1.entries()) {

            lines.push(callback(value, columns1, i, 0));
        }

        embed.addField(title, lines.join('\n'), true);
        embed.addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        lines = [];

        for (const [i, value] of columns2.entries()) {

            lines.push(callback(value, columns2, i, 0));
        }

        embed.addField(Util.BLANK_CHAR, lines.join('\n'), true);

        return embed;
    }

    twoColumnEmptyThird(embed, values, title = 'Title', options = {}) {

        const { callback } = options;

        const [columns1, columns2 = []] = Util.chunk(values, Math.ceil(values.length / 2));

        let lines = [];

        for (const [i, value] of columns1.entries()) {

            lines.push(callback(value, columns1, i, 0));
        }

        embed.addField(title, lines.join('\n'), true);

        lines = [];

        for (const [i, value] of columns2.entries()) {

            lines.push(callback(value, columns2, i, 0));
        }

        embed.addField(Util.BLANK_CHAR, lines.join('\n'), true);
        embed.addField(Util.BLANK_CHAR, Util.BLANK_CHAR, true);

        return embed;
    }
};
