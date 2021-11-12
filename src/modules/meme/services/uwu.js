'use strict';

const { Service } = require('../../../core');

// Based on https://github.com/IModThings/uwufier

const replacements = [
    { trigger : /(ing|er|ai|ed|ion|ore|est|ol|it|ure|ese|et|ad|en|[ou]l)/gi, replacement : (s) => `w${ s }` },
    { trigger : /ac/gi, replacement : () => 'awc' },
    { trigger : /ant/gi, replacement : () => 'awnt' },
    { trigger : /ar/gi, replacement : () => 'awr' },
    { trigger : /ay/gi, replacement : () => 'ai' },
    { trigger : /ble/gi, replacement : () => 'bwul' },
    { trigger : /bod/gi, replacement : () => 'bwod' },
    { trigger : /bout/gi, replacement : () => 'bwout' },
    { trigger : /cal/gi, replacement : () => 'cwal' },
    { trigger : /com/gi, replacement : () => 'cum' },
    { trigger : /coun/gi, replacement : () => 'cown' },
    { trigger : /dif/gi, replacement : () => 'dwif' },
    { trigger : /dis/gi, replacement : () => 'dwis' },
    { trigger : /do/gi, replacement : () => 'dwo' },
    { trigger : /eir/gi, replacement : () => 'ewr' },
    { trigger : /ere/gi, replacement : () => 'ewr' },
    { trigger : /fi/gi, replacement : () => 'fy' },
    { trigger : /ful/gi, replacement : () => 'fwul' },
    { trigger : /fur/gi, replacement : () => 'fwur' },
    { trigger : /gan/gi, replacement : () => 'gwan' },
    { trigger : /ght/gi, replacement : () => 'wgt' },
    { trigger : /go/gi, replacement : () => 'gow' },
    { trigger : /hap/gi, replacement : () => 'hawp' },
    { trigger : /ith/gi, replacement : () => 'iff' },
    { trigger : /know/gi, replacement : () => 'kno' },
    { trigger : /lol/gi, replacement : () => 'lawl' },
    { trigger : /ly/gi, replacement : () => 'lwy' },
    { trigger : /me/gi, replacement : () => 'mi' },
    { trigger : /mem/gi, replacement : () => 'mwem' },
    { trigger : /ment/gi, replacement : () => 'went' },
    { trigger : /not/gi, replacement : () => 'nawt' },
    { trigger : /ood/gi, replacement : () => 'wod' },
    { trigger : /oo/gi, replacement : () => 'wo' },
    { trigger : /ost/gi, replacement : () => 'owst' },
    { trigger : /our/gi, replacement : () => 'owr' },
    { trigger : /par/gi, replacement : () => 'pawr' },
    { trigger : /peo/gi, replacement : () => 'pwe' },
    { trigger : /pic/gi, replacement : () => 'pwic' },
    { trigger : /ple/gi, replacement : () => 'pwl' },
    { trigger : /pro/gi, replacement : () => 'pwo' },
    { trigger : /ree/gi, replacement : () => 'wee' },
    { trigger : /sen/gi, replacement : () => 'swen' },
    { trigger : /so/gi, replacement : () => 'sew' },
    { trigger : /stud/gi, replacement : () => 'stwud' },
    { trigger : /tence/gi, replacement : () => 'twence' },
    { trigger : /the/gi, replacement : () => 'te' },
    { trigger : /tle/gi, replacement : () => 'twle' },
    { trigger : /ture/gi, replacement : () => 'twur' },
    { trigger : /ty/gi, replacement : () => 'twy' },
    { trigger : /ute/gi, replacement : () => 'woot' },
    { trigger : /want/gi, replacement : () => 'wnt' },
    { trigger : /ward/gi, replacement : () => 'wawd' },
    { trigger : /you/gi, replacement : () => 'y-you' },
    { trigger : /but/gi, replacement : () => 'b-but' },
    { trigger : /v|([^\saeou])r/g, replacement : (s) => `${ s }w` },
    { trigger : /[a-z]([^aeiouUO])\./g, replacement : (s) => `${ s } UwU.` },
    { trigger : /[a-z]([aeiou])\./g, replacement : (s) => `${ s } OwO.` },
    { trigger : /[a-z]([^aeiouUO]),/g, replacement : (s) => `${ s } 😳,` },
    { trigger : /[a-z]([aeiou]),/g, replacement : (s) => `${ s } 😳,` }
];

module.exports = class UwuService extends Service {

    /**
     * @param {string} text
     *
     * return {string}
     */
    uwuify(text) {

        return replacements.reduce((text, { trigger, replacement }) => {

            return text.replaceAll(trigger, replacement);

        }, text);
    }
};

