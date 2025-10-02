const Defaults = require('./defaults');
const Currency = require('../../common/currency');
const State    = require('../../../_common/storage').State;

/*
 * Handles currency display
 *
 *  Updated to use default currencies since payout_currencies API is no longer supported
 */
const displayCurrencies = () => {
    const $currency = $('.currency');

    if (!$currency.length) {
        return;
    }

    const defaultCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'BTC', 'ETH'];
    const currencies = State.getResponse('payout_currencies') || defaultCurrencies;

    if (currencies && currencies.length > 1) {
        $currency.html(Currency.getCurrencyList(currencies).html());
        Defaults.set(Defaults.PARAM_NAMES.CURRENCY, $currency.val());
    } else {
        const defaultCurrency = currencies[0] || 'USD';
        $currency.replaceWith($('<span/>', { id: $currency.attr('id'), class: $currency.attr('class'), value: defaultCurrency, html: Currency.formatCurrency(defaultCurrency) }));
        Defaults.set(Defaults.PARAM_NAMES.CURRENCY, defaultCurrency);
    }
};

module.exports = displayCurrencies;
