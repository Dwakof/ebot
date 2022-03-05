'use strict';

const { Service } = require('../../../core');

// Inspired by https://cdn.discordapp.com/attachments/599956355306225689/949479691331444816/Screenshot_20220305-023247.png
// Using some of https://www.wikihow.com/Fake-a-Thick-Russian-Accent teachings

const replacements = [
    { trigger : /friend/gi, replacement : () => 'comrade' },
    { trigger : /[^rR]r[^rR\s]/g, replacement : (s) => `${ s[0] }rr${ s[2] }` },
    { trigger : /[^Rr]R[^Rr\s]/g, replacement : (s) => `${ s[0] }Rr${ s[2] }` },
    { trigger : /ck/g, replacement : () => 'k' },
    { trigger : /\sis\s/gi, replacement : () => ' eez ' },
    { trigger : /[vl][ae][^y]/gi, replacement : (s) => `${ s[0] }y${ s[1] }${ s[2] }` },
    { trigger : /[wv]/g, replacement : (s) => (s === 'v' ? 'w' : 'v') },
    { trigger : /[WV]/g, replacement : (s) => (s === 'V' ? 'W' : 'V') },
    { trigger : /[^aeiou'\s]i[^aeiou'\s]/gi, replacement : (s) => `${ s[0] }ee${ s[2] }` },
    { trigger : /this/g, replacement : () => 'dis' },
    { trigger : /This/g, replacement : () => 'Dis' },
    { trigger : /(\s|$)c[aeiou]/gi, replacement : (s) => ` k${ s[2] }` },
    // { trigger : /R/g, replacement : () => 'Я' },
    // { trigger : /N/g, replacement : () => 'И' },
    // { trigger : /A/g, replacement : () => 'Д' },
    // { trigger : /O/g, replacement : () => 'Ф' },
    // { trigger : /W/g, replacement : () => 'Ш' },
    // { trigger : /X/g, replacement : () => 'Ж' },
    // { trigger : /E/g, replacement : () => 'Э' },
    // { trigger : /U/g, replacement : () => 'Ц' },
    // { trigger : /Y/g, replacement : () => 'Ч' },
    { trigger : /[a-z]([^aeiouUO])\./g, replacement : (s) => `${ s } blyat.` },
    { trigger : /[a-z]([aeiou])\./g, replacement : (s) => `${ s } blyat.` },
    { trigger : /[a-z]([^aeiouUO]),/g, replacement : (s) => `${ s } blyat,` },
    { trigger : /[a-z]([aeiou]),/g, replacement : (s) => `${ s } blyat,` }
];

module.exports = class BlyatService extends Service {

    /**
     * @param {string} text
     *
     * return {string}
     */
    blyatify(text) {

        return replacements.reduce((string, { trigger, replacement }) => {

            return string.replaceAll(trigger, replacement);

        }, text);
    }
};

