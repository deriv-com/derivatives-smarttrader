const isEmptyObject = require('../../_common/utility').isEmptyObject;

const submarket_order = {
    major_pairs     : 1,
    minor_pairs     : 2,
    asia_oceania_OTC: 3,
    europe_OTC      : 4,
    americas_OTC    : 5,
    metals          : 6,
    forex_basket    : 7,
    commodity_basket: 8,
    random_daily    : 9,
    jump_index      : 10,
    step_index      : 11,
    random_index    : 12,
};

const marketOrder = [
    'forex',
    'indices',
    'cryptocurrency',
    'commodities',
    'baskets',
    'synthetics',
];

const derived = ['baskets', 'synthetics'];

const ActiveSymbols = (() => {
    const groupBy = (xs, key) => (
        xs.reduce((rv, x) => {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {})
    );

    const extend = (a, b) => {
        if (!a || !b) return null;
        Object.keys(b).forEach((key) => {
            a[key] = b[key];
        });
        return a;
    };

    const clone = obj => extend({}, obj);

    const getDisplayName = (key) => {
        const displayNames = {
            'forex'           : 'Forex',
            'indices'         : 'Stock Indices',
            'cryptocurrency'  : 'Cryptocurrencies',
            'commodities'     : 'Commodities',
            'synthetic_index' : 'Derived',
            'synthetics'      : 'Synthetics',
            'baskets'         : 'Baskets',
            'random_index'    : 'Continuous Indices',
            'random_daily'    : 'Daily Reset Indices',
            'crash_index'     : 'Crash/Boom Indices',
            'jump_index'      : 'Jump Indices',
            'step_index'      : 'Step Indices',
            'forex_basket'    : 'Forex Basket',
            'commodity_basket': 'Commodities Basket',
            'major_pairs'     : 'Major Pairs',
            'minor_pairs'     : 'Minor Pairs',
            'europe_OTC'      : 'European indices',
            'asia_oceania_OTC': 'Asian indices',
            'americas_OTC'    : 'American indices',
            'metals'          : 'Metals',
            'energy'          : 'Energy',
            'non_stable_coin' : 'Cryptocurrencies',
        };
        return displayNames[key] || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    };

    const generateSymbolDisplayName = (symbolKey) => {
        if (symbolKey.startsWith('frxX')) {
            const commodityMap = {
                'frxXAUUSD': 'Gold/USD',
                'frxXAGUSD': 'Silver/USD',
                'frxXPDUSD': 'Palladium/USD',
                'frxXPTUSD': 'Platinum/USD',
            };
            return commodityMap[symbolKey] || symbolKey.replace('frxX', '').replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
        } else if (symbolKey.startsWith('frx')) {
            const pair = symbolKey.replace('frx', '').replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
            return pair;
        } else if (symbolKey.startsWith('cry')) {
            const pair = symbolKey.replace('cry', '').replace(/([A-Z]{3})([A-Z]{3})/, '$1/$2');
            return pair;
        } else if (symbolKey.startsWith('OTC_')) {
            const indexMap = {
                'OTC_DJI'   : 'Wall Street 30',
                'OTC_SPC'   : 'US 500',
                'OTC_NDX'   : 'US Tech 100',
                'OTC_FTSE'  : 'UK 100',
                'OTC_GDAXI' : 'Germany 40',
                'OTC_FCHI'  : 'France 40',
                'OTC_N225'  : 'Japan 225',
                'OTC_HSI'   : 'Hong Kong 50',
                'OTC_AS51'  : 'Australia 200',
                'OTC_SSMI'  : 'Swiss 20',
                'OTC_SX5E'  : 'Euro 50',
                'OTC_AEX'   : 'Netherlands 25',
                'OTC_IBEX35': 'IBEX 35',
            };
            return indexMap[symbolKey] || symbolKey.replace('OTC_', '');
        } else if (symbolKey.startsWith('WLDX')) {
            const commoditiesBasketMap = {
                'WLDXAU': 'Gold Basket',
                'WLDXAG': 'Silver Basket',
                'WLDXPD': 'Palladium Basket',
                'WLDXPT': 'Platinum Basket',
            };
            return commoditiesBasketMap[symbolKey] || `${symbolKey.replace('WLDX', '')} Basket`;
        } else if (symbolKey.startsWith('WLD')) {
            const currency = symbolKey.replace('WLD', '');
            return `${currency} Basket`;
        } else if (symbolKey.startsWith('R_')) {
            const number = symbolKey.replace('R_', '');
            return `Volatility ${number} Index`;
        } else if (symbolKey.startsWith('JD')) {
            const number = symbolKey.replace('JD', '');
            return `Jump ${number} Index`;
        } else if (symbolKey.startsWith('CRASH') || symbolKey.startsWith('BOOM')) {
            return symbolKey.replace(/(CRASH|BOOM)(\d+)/, '$1 $2 Index');
        } else if (symbolKey.startsWith('RDBEAR') || symbolKey.startsWith('RDBULL')) {
            return symbolKey.replace('RDBEAR', 'Bear Market Index').replace('RDBULL', 'Bull Market Index');
        } else if (symbolKey.startsWith('stpRNG')) {
            const number = symbolKey.replace('stpRNG', '') || '1';
            return `Step Index ${number}00`;
        } else if (symbolKey.match(/^\d+HZ\d+V$/)) {
            // Handle volatility indices like 1HZ100V, 1HZ75V, etc.
            const match = symbolKey.match(/^(\d+)HZ(\d+)V$/);
            if (match) {
                const [, frequency, volatility] = match;
                return `Volatility ${volatility} (${frequency}s) Index`;
            }
        }
        
        return symbolKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim();
    };

    let markets    = {};
    let submarkets = {};
    let symbols    = {};

    const getMarkets = (all_symbols) => {
        if (!isEmptyObject(markets)) {
            return clone(markets);
        }

        const all_markets = groupBy(all_symbols, 'market');
        const derived_markets = groupBy(all_markets.synthetic_index, 'subgroup');
        delete all_markets.synthetic_index;
        const final_markets = { ...all_markets, ...derived_markets };
        
        Object.keys(final_markets).forEach((key) => {
            const market_name    = key;
            const market_symbols = final_markets[key];
            const symbol         = market_symbols[0];

            markets[market_name] = {
                name: symbol.market === 'synthetic_index' ?
                    getDisplayName(symbol.subgroup) :
                    getDisplayName(symbol.market),
                is_active    : !symbol.is_trading_suspended && symbol.exchange_is_open,
                subgroup_name: symbol.subgroup !== 'none' ?
                    getDisplayName(symbol.market) :
                    getDisplayName(symbol.subgroup),
                subgroup: symbol.subgroup !== 'none' ? symbol.market : symbol.subgroup,
            };
            getSubmarketsForMarket(market_symbols, markets[market_name]);
        });
        return clone(markets);
    };

    const clearData = () => {
        markets    = {};
        symbols    = {};
        submarkets = {};
    };

    const getSubmarketsForMarket = (all_symbols, market) => {
        if (!isEmptyObject(market.submarkets)) {
            return clone(market.submarkets);
        }
        market.submarkets = {};

        const all_submarkets = groupBy(all_symbols, 'submarket');

        Object.keys(all_submarkets).forEach((key) => {
            const submarket_name    = key;
            const submarket_symbols = all_submarkets[key];
            const symbol            = submarket_symbols[0];

            market.submarkets[submarket_name] = {
                name     : getDisplayName(submarket_name),
                is_active: !symbol.is_trading_suspended && symbol.exchange_is_open,
            };

            getSymbolsForSubmarket(submarket_symbols, market.submarkets[submarket_name]);
        });
        return clone(market.submarkets);
    };

    const getSymbolsForSubmarket = (all_symbols, submarket) => {
        if (isEmptyObject(submarket.symbols)) {
            submarket.symbols = {};
            all_symbols.forEach((symbol) => {
                const symbolKey = symbol.underlying_symbol;
                if (symbolKey) {
                    submarket.symbols[symbolKey] = {
                        display    : generateSymbolDisplayName(symbolKey),
                        symbol_type: symbol.underlying_symbol_type,
                        is_active  : !symbol.is_trading_suspended && symbol.exchange_is_open,
                        pip_size   : symbol.pip_size,
                        market     : symbol.market !== 'synthetic_index' ? symbol.market : symbol.subgroup,
                        submarket  : symbol.submarket,
                    };
                }
            });
        }
        return clone(submarket.symbols);
    };

    const getSubmarkets = (active_symbols) => {
        if (isEmptyObject(submarkets)) {
            const all_markets = getMarkets(active_symbols);
            Object.keys(all_markets).forEach((key) => {
                const market         = all_markets[key];
                const all_submarkets = getSubmarketsForMarket(active_symbols, market);
                extend(submarkets, all_submarkets);
            });
        }
        return clone(submarkets);
    };

    const getSymbols = (active_symbols) => {
        if (isEmptyObject(symbols)) {
            const all_submarkets = getSubmarkets(active_symbols);
            Object.keys(all_submarkets).forEach((key) => {
                const submarket   = all_submarkets[key];
                const all_symbols = getSymbolsForSubmarket(active_symbols, submarket);
                extend(symbols, all_symbols);
            });
        }
        return clone(symbols);
    };

    const getSymbolsForMarket = (active_symbols, market) => {
        const all_symbols = getSymbols(active_symbols);

        const filtered_symbols = Object.keys(all_symbols)
            // only keep the symbols of the currently selected market
            .filter(symbol => all_symbols[symbol].market === market)
            // sort them by the submarket order defined
            .sort((symbol_a, symbol_b) =>
                sortSubmarket(all_symbols[symbol_a].submarket, all_symbols[symbol_b].submarket)
            )
            // make it into an object again with all needed data
            .reduce((obj, symbol) => ({
                ...obj,
                [symbol]: all_symbols[symbol],
            }), {});

        return clone(filtered_symbols);
    };

    const sortSubmarket = (a, b) => {
        if (submarket_order[a] > submarket_order[b]) {
            return 1;
        } else if (submarket_order[a] < submarket_order[b]) {
            return -1;
        }
        return 0;
    };

    const getMarketsList = (active_symbols) => {
        const trade_markets_list = {};
        extend(trade_markets_list, getMarkets(active_symbols));
        extend(trade_markets_list, getSubmarkets(active_symbols));
        return trade_markets_list;
    };
    
    const getAvailableUnderlyings = (markets_list) => {
        const markets_list_clone = clone(markets_list);

        Object.keys(markets_list_clone).forEach(market_key => {
            Object.keys(markets_list_clone[market_key].submarkets).forEach(submarket_key => {
                if (Object.keys(markets_list_clone[market_key].submarkets[submarket_key].symbols).length === 0) {
                    delete markets_list_clone[market_key].submarkets[submarket_key];
                }
            });
            if (Object.keys(markets_list_clone[market_key].submarkets).length === 0){
                delete markets_list_clone[market_key];
            }
        });
        if (Object.keys(markets_list_clone).length === 0) return [];
        return markets_list_clone;
    };

    const getTradeUnderlyings = (active_symbols) => {
        const trade_underlyings = {};
        const all_symbols       = getSymbols(active_symbols);
        Object.keys(all_symbols).forEach((key) => {
            const symbol = all_symbols[key];
            if (!trade_underlyings[symbol.market]) {
                trade_underlyings[symbol.market] = {};
            }
            if (!trade_underlyings[symbol.submarket]) {
                trade_underlyings[symbol.submarket] = {};
            }
            trade_underlyings[symbol.market][key]    = symbol;
            trade_underlyings[symbol.submarket][key] = symbol;
        });
        return trade_underlyings;
    };

    const getSymbolNames = (active_symbols) => {
        const all_symbols = clone(getSymbols(active_symbols));
        Object.keys(all_symbols).forEach((key) => {
            all_symbols[key] = all_symbols[key].display;
        });
        return all_symbols;
    };

    const sortObjectByKeys = (obj, order) => {
        const orderedObj = {};
        const remainingObj = {};
    
        // Add keys in the specified order
        order.forEach(key => {
            // eslint-disable-next-line no-prototype-builtins
            if (obj.hasOwnProperty(key)) {
                orderedObj[key] = obj[key];
            }
        });
    
        // Add any remaining keys that were not specified in the order array
        Object.keys(obj).forEach(key => {
            // eslint-disable-next-line no-prototype-builtins
            if (!orderedObj.hasOwnProperty(key)) {
                remainingObj[key] = obj[key];
            }
        });
    
        // Combine ordered keys and remaining keys
        return { ...orderedObj, ...remainingObj };
    };

    return {
        getMarkets,
        getSubmarkets,
        getMarketsList,
        getTradeUnderlyings,
        getSymbolNames,
        clearData,
        getSymbols,
        getSymbolsForMarket,
        sortSubmarket,
        getAvailableUnderlyings,
        generateSymbolDisplayName,
        marketOrder,
        derived,
        sortObjectByKeys,
    };
})();

module.exports = ActiveSymbols;
