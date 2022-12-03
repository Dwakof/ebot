'use strict';

const CurrencyJS = require('currency.js');

const { ServiceApi, Util } = require('../../../core');

module.exports = class GPT3Service extends ServiceApi {

    static ENDPOINT = 'https://api.openai.com';

    static modelPrice = {
        'text-davinci-003' : 0.02,
        'text-curie-001'   : 0.002,
        'text-babbage-001' : 0.0005,
        'text-ada-001'     : 0.0004
    };

    init(settings) {

        super.init(settings);

        this.defaultHeaders = {
            Authorization         : `Bearer ${ settings.openai.apiKey }`,
            'OpenAI-Organization' : settings.openai.organization,
            'Content-Type'        : 'application/json'
        };
    }

    /**
     * @param {String}                       input
     * @param {String}                       [model="text-curie-001"]
     * @param {CharacterService~Character[]} [characters=[]]
     * @param {Object}                       [options={}]
     *
     * @return {Promise<{tokens: number, text : string, price : string}>}
     */
    async completion(input, model = 'text-curie-001', characters = [], options = {}) {

        let prompt = input;

        if (characters.length > 0) {

            const { CharacterService } = this.services();

            prompt = Util.dedent`
                With this list of characters : 
                
                ${ characters.map(CharacterService.characterToText).join('\n\n') }
                
                
                ${ input }
            `;
        }

        const { choices : [{ text }], usage : { total_tokens } } = await this.api.post(`/v1/engines/${ model }/completions`, JSON.stringify({
            max_tokens  : 1024,
            temperature : options.temperature ?? 1,
            user        : options.user,
            prompt
        }));

        return { text, tokens : total_tokens, price : GPT3Service.price(model, total_tokens) };
    }

    static price(model, tokens = 0) {

        return CurrencyJS(tokens / 1_000, { separator : ' ', symbol : '¢ ', decimal : '.', precision : 3 })
            .multiply(GPT3Service.modelPrice[model] ?? 0)
            .multiply(100)
            .format();
    }

    async listModel() {

        const { data } = await this.api.get(`/v1/models`);

        return data;
    }
};
