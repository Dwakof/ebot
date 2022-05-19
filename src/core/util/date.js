'use strict';

const { Duration } = require('luxon');

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR   = 60 * MINUTE;
const DAY    = 24 * HOUR;

/**
 * @type {Intl.RelativeTimeFormatUnit[]}
 */
const TIME_UNITS   = ['second', 'minute', 'hour', 'day', 'week', 'month', 'year'];
const TIME_CUTOFFS = [MINUTE, HOUR, DAY, DAY * 7, DAY * 30, DAY * 365, Infinity];

const SHORT_TIME_UNITS   = ['ms', 's', 'm', 'h', 'd', 'w', 'M', 'y'];
const SHORT_TIME_CUTOFFS = [SECOND, ...TIME_CUTOFFS];

module.exports = {

    SECOND, MINUTE, HOUR, DAY,

    /**
     * Return a string representing the amount of time humanized up to the millisecond.
     *
     * @param {Number|Duration} time - The amount of time in milliseconds.
     *
     * @returns {string}             - The humanized time.
     *
     * @example
     * // returns '1s'
     * getTimeString(1000);
     * @example
     * // returns '1h 35m'
     * getTimeString(2_100_060);
     * @example
     * // returns '- 1h 35m'
     * getTimeString(-2_100_060);
     */
    getTimeString(time) {

        let _time = time;

        if (time instanceof Duration) {

            _time = time.milliseconds;
        }

        if (_time === 0) {

            return '0ms';
        }

        const part = [];

        if (_time < 0) {

            part.push('-');
        }

        _time = Math.abs(_time);

        let index = SHORT_TIME_CUTOFFS.findIndex((cutoff) => cutoff > _time);

        do {

            const cutoff = SHORT_TIME_CUTOFFS[index - 1] ?? 1;
            const value  = Math.floor(_time / cutoff);

            if (value > 0) {

                part.push(`${ Math.floor(value) }${ SHORT_TIME_UNITS[index] }`);
                _time = _time % cutoff;
            }

            index--;

        } while (index >= 0 && _time !== 0);

        return part.join(' ');
    },

    /**
     * @param {Number|Date} date
     * @param {String}      [lang='en']
     *
     * @return {String}
     */
    getRelativeTimeString(date, lang = 'en') {

        const timeMs = typeof date === 'number' ? date : date.getTime();

        const delta = Math.round(timeMs - Date.now());

        const unitIndex = TIME_CUTOFFS.findIndex((cutoff) => cutoff > Math.abs(delta));
        const divisor   = unitIndex ? TIME_CUTOFFS[unitIndex - 1] : 1;
        const rtf       = new Intl.RelativeTimeFormat(lang, { numeric : 'auto' });

        return rtf.format(Math.floor(delta / divisor), TIME_UNITS[unitIndex]);
    }
};
