const getFormNameBarrierCategory = require('./common').getFormNameBarrierCategory;
const localize                   = require('../../../_common/localize').localize;
const getPropertyValue           = require('../../../_common/utility').getPropertyValue;
const isEmptyObject              = require('../../../_common/utility').isEmptyObject;

/*
 * Contract object mocks the trading form we have on our website
 * It parses the contracts json we get from socket.send({contracts_for: 'R_50'})
 * and gives back barriers, startDate, durations etc
 *
 *
 * Usage:
 *
 * use `Contract.details` to populate this object
 *
 * then use
 *
 * `Contract.durations()` to get durations like seconds, hours etc
 * `Contract.open()` `Contract.close()`
 * `Contract.barriers` if applicable for current underlying
 */

const CATEGORY_TYPES = {
    callput      : ['risefall'],
    higherlower  : ['higherlower'],
    touchnotouch : ['touchnotouch'],
    inout        : ['endsinout', 'staysinout'],
    asian        : ['asians'],
    digits       : ['matchdiff', 'evenodd', 'overunder'],
    reset        : ['resetcall' , 'resetput'],
    highlowticks : ['highlowticks'],
    runs         : ['runs'],
    callputspread: ['callputspread'],
};

const CATEGORY_NAMES = {
    callput      : 'Up/Down',
    higherlower  : 'Higher/Lower',
    touchnotouch : 'Touch/No Touch',
    inout        : 'In/Out',
    asian        : 'Asians',
    digits       : 'Digits',
    reset        : 'Reset Call/Reset Put',
    callputspread: 'Call Spread/Put Spread',
    highlowticks : 'High/Low Ticks',
    runs         : 'Only Ups/Only Downs',
};

const CATEGORY_ITEMS = {
    inout        : 'In/Out',
    endsinout    : 'Ends Between/Ends Outside',
    staysinout   : 'Stays Between/Goes Outside',
    risefall     : 'Rise/Fall',
    higherlower  : 'Higher/Lower',
    touchnotouch : 'Touch/No Touch',
    matchdiff    : 'Matches/Differs',
    evenodd      : 'Even/Odd',
    overunder    : 'Over/Under',
    resetcall    : 'Reset Call',
    resetput     : 'Reset Put',
    highlowticks : 'High/Low Ticks',
    asians       : 'Asians',
    runs         : 'Only Ups/Only Downs',
    callputspread: 'Call Spread/Put Spread',
};

/**
 * Get display name for contract type
 * @param {string} contract_type - The contract type code (e.g., 'DIGITMATCH')
 * @returns {string} - Human readable display name
 */
const getContractTypeDisplayName = (contract_type) => {
    const contractTypeMapping = {
        // Basic Call/Put
        CALL  : localize('Rise'),
        CALLE : localize('Rise or equal'),
        PUT   : localize('Fall'),
        PUTE  : localize('Fall or equal'),
        HIGHER: localize('Higher'),
        LOWER : localize('Lower'),
        
        // Asian Options
        ASIANU: localize('Asian Up'),
        ASIAND: localize('Asian Down'),
        
        // Digit Contracts
        DIGITMATCH: localize('Digit Matches'),
        DIGITDIFF : localize('Digit Differs'),
        DIGITODD  : localize('Digit Odd'),
        DIGITEVEN : localize('Digit Even'),
        DIGITOVER : localize('Digit Over'),
        DIGITUNDER: localize('Digit Under'),
        
        // Expiry Contracts
        EXPIRYMISS  : localize('Ends Outside'),
        EXPIRYMISSE : localize('Ends Outside'),
        EXPIRYRANGE : localize('Ends Between'),
        EXPIRYRANGEE: localize('Ends Between'),
        
        // Range/Touch Contracts
        RANGE   : localize('Stays Between'),
        UPORDOWN: localize('Goes Outside'),
        ONETOUCH: localize('Touches'),
        NOTOUCH : localize('Does Not Touch'),
        
        // Reset Contracts
        RESETCALL: localize('Reset Call'),
        RESETPUT : localize('Reset Put'),
        
        // Tick Contracts
        TICKHIGH: localize('High Tick'),
        TICKLOW : localize('Low Tick'),
        
        // Run Contracts
        RUNHIGH: localize('Only Ups'),
        RUNLOW : localize('Only Downs'),
    };
    
    return contractTypeMapping[contract_type] || contract_type;
};

const Contract = (() => {
    const contract_type = {};

    let contract_details = {};
    const barriers       = {};
    let durations        = {};

    let open,
        close,
        form,
        barrier;

    const populateDurations = (current_contract) => {
        const current_category = current_contract.contract_category;
        const expiry_type      = current_contract.expiry_type;
        const max_duration     = current_contract.max_contract_duration;
        const min_duration     = current_contract.min_contract_duration;

        if (!durations[expiry_type]) {
            durations[expiry_type] = {};
        }

        if (!durations[expiry_type][current_category]) {
            durations[expiry_type][current_category] = {};
        }

        durations[expiry_type][current_category].max_contract_duration = max_duration;
        durations[expiry_type][current_category].min_contract_duration = min_duration;
    };

    const details = (form_name) => {
        const contracts = Contract.contracts().contracts_for;

        if (!contracts) return;

        durations   = {};
        open        = contracts.open;
        close       = contracts.close;

        const form_barrier = getFormNameBarrierCategory(form_name);
        form               = form_barrier.form_name;
        if (!form) {
            return;
        }

        contracts.available.forEach((current_obj) => {
            const contract_category = current_obj.contract_category;
            // Populate durations for matching contract categories
            if (form === contract_category) {
                populateDurations(current_obj);
            }
            
            if (form === contract_category) {
                const symbol = current_obj.underlying_symbol;
                if (!getPropertyValue(barriers, symbol)) {
                    barriers[symbol] = {};
                }
                if (!getPropertyValue(barriers[symbol], contract_category)) {
                    barriers[symbol][contract_category] = {};
                }
                if (!getPropertyValue(barriers[symbol][contract_category], current_obj.expiry_type)) {
                    barriers[symbol][contract_category][current_obj.expiry_type] = {};
                }
                if (current_obj.barriers === 1) {
                    barriers[symbol][contract_category][current_obj.expiry_type] = {
                        count  : 1,
                        barrier: current_obj.barrier,
                    };
                } else if (current_obj.barriers === 2) {
                    barriers[symbol][contract_category][current_obj.expiry_type] = {
                        count   : 2,
                        barrier : current_obj.high_barrier,
                        barrier1: current_obj.low_barrier,
                    };
                }

                if (!contract_type[contract_category]) {
                    contract_type[contract_category] = {};
                }

                const type = current_obj.contract_type;
                if (!getPropertyValue(contract_type[contract_category], type)) {
                    const display_text = getContractTypeDisplayName(type);
                    contract_type[contract_category][type] = display_text;
                }
            }
        });
    };

    const categoryMaker = (category) => {
        const object = {
            category,
        };
        return object;
    };

    const getContractCategories = () => {
        const contracts           = Contract.contracts().contracts_for;
        const contract_categories = {};
        
        // Check if contracts are available
        if (!contracts.available) {
            return contract_categories;
        }
        
        contracts.available.forEach((current_obj) => {
            const contract_category = current_obj.contract_category;
            const contract_display  = current_obj.contract_category_display ||
                                       current_obj.contract_display ||
                                       contract_category;
            if (contract_category && !getPropertyValue(contract_categories, contract_category)) {
                contract_categories[contract_category] = categoryMaker(
                    localize(contract_display /* localize-ignore */)
                );
                Object.keys(CATEGORY_TYPES).forEach(category => {
                    const categoryRegEx = new RegExp(category, 'gi');
                    if (contract_category.match(categoryRegEx)) {
                        contract_categories[category] = categoryMaker(
                            localize(CATEGORY_NAMES[category] /* localize-ignore */)
                        );
                        CATEGORY_TYPES[category].forEach(t => {
                            contract_categories[t] = categoryMaker(
                                localize(CATEGORY_ITEMS[t] /* localize-ignore */)
                            );
                        });
                    }
                });
            }
        });
        return contract_categories;
    };

    const getContractForms = () => {
        const contract_categories  = getContractCategories();
        const trade_contract_forms = {};
        if (!contract_categories) return null;
        Object.keys(contract_categories).forEach(element => {
            trade_contract_forms[element] = contract_categories[element].category;
        });
        if (isEmptyObject(trade_contract_forms)) return null;
        return trade_contract_forms;
    };

    return {
        details,
        contractForms: getContractForms,
        open         : () => open,
        close        : () => close,
        contracts    : () => contract_details,
        durations    : () => durations,
        barriers     : () => barriers,
        contractType : () => contract_type,
        form         : () => form,
        barrier      : () => barrier,
        setContracts : (data) => { contract_details = data; },
    };
})();

module.exports = Contract;
