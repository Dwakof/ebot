'use strict';

const Lunr = require('lunr');

const { Service, Util } = require('../../../core');

module.exports = class CharacterService extends Service {

    /**
     * @typedef {Object}  CharacterService~Character
     *
     * @property {String} id
     * @property {String} name
     * @property {String} [description]
     * @property {String} [story]
     * @property {String} [gender]
     * @property {String} [age]
     */

    /**
     * @param {CharacterService~Character} character
     *
     * @return {String}
     */
    characterToText(character) {

        return Util.dedent`
            name: ${ character.name }
            age: ${ character.age || 'unknown' }
            gender: ${ character.gender || 'unknown' }
            story: ${ character.story }
        `;
    }

    /**
     * @param {String}                       text
     * @param {CharacterService~Character[]} characters
     *
     * @return {String[]}
     */
    findInText(text, characters) {

        return Array.from(characters.reduce((set, { name, id }) => {

            if (new RegExp(`\\s${ name }[\\s',.:;]`, 'gmi').test(`${ text } `)) {

                return set.add(id);
            }

            if (new RegExp(`\\s${ id }[\\s',.:;]`, 'gmi').test(`${ text } `)) {

                return set.add(id);
            }

            return set;

        }, new Set()));
    }

    async buildIndex(guildId) {

        const entries = await this.store.list('character', guildId);

        const names = new Map();

        const index = Lunr(function () {

            this.ref('id');
            this.field('name');

            this.pipeline.remove(Lunr.stemmer);
            this.searchPipeline.remove(Lunr.stemmer);

            for (const { value : { name, id } } of entries) {

                this.add({ id, name });
                names.set(id, name);
            }
        });

        return { index, names };
    }

    /**
     * @param {String} guildId
     * @param {String} text
     * @param {Object} [options]
     *
     * @return {Promise<Array<{ name : String, id : String }>>}
     */
    async autocomplete(guildId, text, { limit = 25 } = {}) {

        const { index, names } = await this.buildIndex(guildId);

        return index.query((q) => {
            // exact matches should have the highest boost
            q.term(text, { boost : 100 });

            // prefix matches should be boosted slightly
            q.term(text, { boost : 10, usePipeline : false, wildcard : Lunr.Query.wildcard.TRAILING });

            // finally, try a fuzzy search, without any boost
            q.term(text, { boost : 1, usePipeline : false, editDistance : 1 });

        }).slice(0, limit).map(({ ref }) => ({ id : ref, name : names.get(ref) }));
    }

    static get caching() {

        return {
            buildIndex : {
                max : 100,
                ttl : Util.MINUTE
            }
        };
    }
};
