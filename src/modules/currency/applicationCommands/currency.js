'use strict';

const { inlineCode }         = require('@discordjs/builders');
const { DateTime, Duration } = require('luxon');

const { ApplicationCommand, Util } = require('../../../core');

module.exports = class Currency extends ApplicationCommand {

    constructor() {

        super('currency', { description : 'currency' });
    }

    static get subcommands() {

        return {
            convert : {
                method      : 'convert',
                description : 'Convert currency',
                options     : {
                    from   : {
                        type         : ApplicationCommand.SubTypes.String,
                        description  : 'Currency to convert from',
                        autocomplete : 'autocompleteFrom',
                        required     : true
                    },
                    to     : {
                        type         : ApplicationCommand.SubTypes.String,
                        description  : 'Currency to convert to',
                        autocomplete : 'autocompleteTo',
                        required     : true
                    },
                    amount : {
                        type        : ApplicationCommand.SubTypes.Number,
                        description : 'Amount to convert',
                        required    : true
                    }
                }
            },
            history : {
                method      : 'history',
                description : 'rate history between two currencies',
                options     : {
                    from   : {
                        type         : ApplicationCommand.SubTypes.String,
                        description  : 'Currency to convert from',
                        autocomplete : 'autocompleteFrom',
                        required     : true
                    },
                    to     : {
                        type         : ApplicationCommand.SubTypes.String,
                        description  : 'Currency to convert to',
                        autocomplete : 'autocompleteTo',
                        required     : true
                    },
                    range  : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Amount to convert',
                        required    : false,
                        default     : '1Y',
                        choices     : {
                            '1 month'  : '1M',
                            '3 months' : '3M',
                            '6 months' : '6M',
                            '1 year'   : '1Y',
                            '2 years'  : '2Y',
                            '5 years'  : '5Y'
                        }
                    },
                    amount : {
                        type        : ApplicationCommand.SubTypes.Number,
                        description : 'Amount to convert',
                        required    : false,
                        default     : 1
                    }
                }
            },
            search  : {
                method      : 'search',
                description : 'Search for currency',
                options     : {
                    query : {
                        type        : ApplicationCommand.SubTypes.String,
                        description : 'Channel to get statistic for',
                        required    : true
                    }
                }
            },
            list    : {
                method      : 'list',
                description : 'List all currencies',
                options     : {}
            }
        };
    }

    autocomplete(interaction, query) {

        const { CurrencyService } = this.services();

        const currencies = CurrencyService.autocomplete(query);

        if (currencies.length === 0) {

            return interaction.respond([{ name : 'No result found', value : query }]);
        }

        const list = currencies.slice(0, 25)
            .map(({ code, currency, symbol }) => ({ name : `${ code } : ${ currency } (${ symbol })`, value : code }));

        return interaction.respond(list);
    }

    autocompleteFrom(interaction, { from }) {

        return this.autocomplete(interaction, from);
    }

    autocompleteTo(interaction, { to }) {

        return this.autocomplete(interaction, to);
    }

    search(interaction, { query }) {

        const { CurrencyService } = this.services();
        const { CurrencyView }    = this.views();

        const currencies = CurrencyService.search(query);

        if (currencies.length === 0) {

            return interaction.reply({ embeds : [CurrencyView.currencyNotFound(query)], ephemeral : true });
        }

        return this.client.util.send(interaction, CurrencyView.list(currencies));
    }

    list(interaction) {

        const { CurrencyService } = this.services();
        const { CurrencyView }    = this.views();

        const currencies = CurrencyService.list();

        return new Util.PaginatedEmbeds(interaction, Util.chunk(currencies, 12).map(CurrencyView.list.bind(CurrencyView))).send();
    }

    /**
     * @param {Object} interaction
     * @param {String} from
     * @param {String} to
     *
     * @return {{toCurrency: Currency, fromCurrency: Currency}}
     * @private
     */
    _parseCurrencies(interaction, { from, to }) {

        const { CurrencyService } = this.services();
        const { CurrencyView }    = this.views();

        const fromCurrency = CurrencyService.find(from);
        const toCurrency   = CurrencyService.find(to);

        if (!fromCurrency) {

            interaction.reply({ embeds : [CurrencyView.currencyNotFound(from)], ephemeral : true });

            throw new Error(`Currency "${ from }" not found`);
        }

        if (!toCurrency) {

            interaction.reply({ embeds : [CurrencyView.currencyNotFound(to)], ephemeral : true });

            throw new Error(`Currency "${ to }" not found`);
        }

        return { fromCurrency, toCurrency };
    }

    async convert(interaction, { from, to, amount }) {

        const { CurrencyService } = this.services();

        const { fromCurrency, toCurrency } = this._parseCurrencies(interaction, { from, to });

        const { value, rate } = await CurrencyService.convert(CurrencyService.find(from), CurrencyService.find(to), amount);

        const strings = [
            `${ inlineCode(CurrencyService.format(amount)) } ${ fromCurrency.symbol }  ${ Util.RIGHT_ARROW }  ${ inlineCode(CurrencyService.format(value)) } ${ toCurrency.symbol } (rate ${ inlineCode(rate) })`
        ];

        return this.client.util.send(interaction, strings.join('\n'));
    }

    async history(interaction, { from, to, range, amount }) {

        const { CurrencyService } = this.services();
        const { CurrencyView }    = this.views();

        const { fromCurrency, toCurrency } = this._parseCurrencies(interaction, { from, to });

        await interaction.deferReply();

        const { rates } = await CurrencyService.getLongerHistory(fromCurrency.code, DateTime.now().minus(Duration.fromISO(`P${ range }`)), undefined, [toCurrency.code]);

        const stats = [];

        for (const [datetime, currencies] of Object.entries(rates)) {

            stats.push({
                time  : new Date(datetime),
                rate  : currencies[toCurrency.code],
                value : CurrencyService._convert(currencies[toCurrency.code], amount)
            });
        }

        return this.client.util.send(interaction, await CurrencyView.history(fromCurrency, toCurrency, amount, stats));
    }
};
