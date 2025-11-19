const { localize } = require('@deriv-com/translations');
const moment                       = require('moment');
const Cookies                      = require('js-cookie');
const isCryptocurrency             = require('./currency_base').isCryptocurrency;
const SocketCache                  = require('./socket_cache');
const LocalStore                   = require('../storage').LocalStore;
const SessionStore                 = require('../storage').SessionStore;
const State                        = require('../storage').State;

const ClientBase = (() => {
    const storage_key = 'current_account';
    let current_account = {};
    let total_balance = {};
    let current_loginid;

    const init = () => {
        current_account = getCurrentAccount();

        // Simple single-account initialization
        current_loginid = current_account.loginid || SessionStore.get('active_loginid') || LocalStore.get('active_loginid');

        if (current_loginid && current_account.currency) {
            const url = new URL(window.location.href);
            const account_param = /^VR/.test(current_loginid) ? 'demo' : current_account.currency;
            if (account_param) {
                url.searchParams.set('account', new URLSearchParams(window.location.search).get('account') || account_param);
                window.history.replaceState({}, '', url.toString());
            }
        }
    };

    const isLoggedIn = () => !!localStorage.getItem('session_token');

    /**
     * Stores the client information in local variable and localStorage
     *
     * @param {String} key                 The property name to set
     * @param {String|Number|Object} value The regarding value
     * @param {String|null} loginid        The account to set the value for
     */
    const set = (key, value) => {
        if (key === 'loginid' && value !== current_loginid) {
            SessionStore.set('active_loginid', value);
            LocalStore.set('active_loginid', value);
            current_loginid = value;
            current_account.loginid = value;
            const url = new URL(window.location.href);
            const account_param = /^VR/.test(value) ? 'demo' : current_account.currency;
            if (account_param) {
                url.searchParams.set('account', account_param);
                url.searchParams.set('currency', current_account.currency);
                window.history.replaceState({}, '', url.toString());
            }
        } else {
            // Simple single-account property setting
            current_account[key] = value;
            LocalStore.setObject(storage_key, current_account);
        }
    };

    /**
     * Returns the client information
     *
     * @param {String|null} key     The property name to return the value from, if missing returns the account object
     * @param {String|null} loginid The account to return the value from
     */
    const get = (key) => {
        let value;
        if (key === 'loginid') {
            value = current_account.loginid || SessionStore.get('active_loginid') || LocalStore.get('active_loginid');
        } else if (key === 'token') {
            // Always return session token for pure session token authentication
            value = localStorage.getItem('session_token');
        } else {
            // Simple single-account property retrieval
            value = key ? current_account[key] : current_account;
        }
        if (!Array.isArray(value) && (+value === 1 || +value === 0 || value === 'true' || value === 'false')) {
            value = JSON.parse(value || false);
        }
        return value;
    };

    const setTotalBalance = (amount, currency) => total_balance = { amount, currency };

    const getTotalBalance = () => total_balance;

    const getCurrentAccount = () => LocalStore.getObject(storage_key) || {};

    // only considers currency of real money accounts
    // @param {String} type = crypto|fiat
    const hasCurrencyType = (type) => {
        if (type === 'crypto') {
            // find if has crypto currency account
            return !get('is_virtual') && isCryptocurrency(get('currency'));
        }
        // else find if have fiat currency account
        return !get('is_virtual') && !isCryptocurrency(get('currency'));
    };

    const hasOnlyCurrencyType = (type = 'fiat') => {
        const loginid = current_account.loginid;
        const real_loginid = /^(MX|MF|MLT|CR|FOG)[0-9]+$/i;
        if (!loginid || !real_loginid.test(loginid)) return false;
        
        if (type === 'crypto') {
            return isCryptocurrency(get('currency'));
        }
        if (type === 'unset') {
            return !get('currency');
        }

        return get('currency') && !isCryptocurrency(get('currency'));
    };

    /**
     * Handle authorization response specifically for session token authentication
     * Simplified for single-account token exchange
     */
    const responseAuthorizeSessionToken = (response) => {
        const authorize = response.authorize;
        if (!authorize || !authorize.loginid) {
            return;
        }

        // Set current loginid
        current_loginid = authorize.loginid;
        
        // Get session token
        const sessionToken = localStorage.getItem('session_token');
        
        // Set account properties for single logged-in account
        set('loginid',    authorize.loginid);
        // Note: token is always retrieved from localStorage in pure session token system
        set('email',      authorize.email || '');
        set('country',    authorize.country || '');
        set('currency',   authorize.currency);
        set('is_virtual', +authorize.is_virtual);
        set('balance',    authorize.balance);
        set('session_start', parseInt(moment().valueOf() / 1000));
        
        // Set optional properties if they exist
        if (authorize.landing_company_name) {
            set('landing_company_shortcode', authorize.landing_company_name);
        }
        if (authorize.user_id) {
            set('user_id', authorize.user_id);
        }
        
        // Store session token for compatibility
        current_account.token = sessionToken;
        
        // Single storage operation for account data
        LocalStore.setObject(storage_key, current_account);
        LocalStore.set('active_loginid', authorize.loginid);
        
        // Set simplified client information cookie
        const client_information = {
            loginid   : authorize.loginid,
            email     : authorize.email || '',
            currency  : authorize.currency,
            is_virtual: +authorize.is_virtual,
            user_id   : authorize.user_id || '',
        };
        
        const currentDomain = `.${window.location.hostname.split('.').slice(-2).join('.')}`;
        
        Cookies.set('client_information', JSON.stringify(client_information), {
            domain: currentDomain,
            path  : '/',
        });
        
        // Save session token as cookie under same domain as client_information for dtrader access
        if (sessionToken) {
            Cookies.set('session_token', sessionToken, {
                domain  : currentDomain,
                path    : '/',
                secure  : window.location.protocol === 'https:',
                sameSite: 'Lax',
            });
        }
    };

    const clearAllAccounts = () => {
        current_loginid = undefined;
        current_account = {};
        LocalStore.setObject(storage_key, current_account);
    };

    const setNewAccount = (options) => {
        if (!options.email || !options.loginid || !options.token) {
            return false;
        }

        SocketCache.clear();
        localStorage.setItem('GTM_new_account', '1');

        set('token',      options.token);
        set('email',      options.email);
        set('is_virtual', +options.is_virtual);
        set('loginid',    options.loginid);

        return true;
    };

    const currentLandingCompany = () => {
        const landing_company_response = State.getResponse('landing_company') || {};
        const this_shortcode           = get('landing_company_shortcode');
        const landing_company_prop     = Object.keys(landing_company_response).find((key) => (
            this_shortcode === landing_company_response[key].shortcode
        ));
        return landing_company_response[landing_company_prop] || {};
    };

    // * MT5 login list returns these:
    // market_type: "financial" | "gaming"
    // sub_account_type: "financial" | "financial_stp" | "swap_free"
    // *
    const getMT5AccountDisplays = (market_type, sub_account_type, is_demo) => {
        // needs to be declared inside because of localize
        // TODO: handle swap_free when ready

        const account_market_type = market_type === 'synthetic' ? 'gaming' : market_type;
        const obj_display = {
            gaming: {
                financial: {
                    short: localize('Synthetic'),
                    full : is_demo ? localize('Demo Synthetic') : localize('Real Synthetic'),
                },
            },
            financial: {
                financial: {
                    short: localize('Financial'),
                    full : is_demo ? localize('Demo Financial') : localize('Real Financial'),
                },
                financial_stp: {
                    short: localize('Financial STP'),
                    full : is_demo ? localize('Demo Financial STP') : localize('Real Financial STP'),
                },
            },
        };

        // returns e.g. { short: 'Synthetic', full: 'Demo Synthetic' }
        return obj_display[account_market_type][sub_account_type] || localize('MT5');
    };

    const getBasicUpgradeInfo = () => {
        const upgradeable_landing_companies = State.getResponse('authorize.upgradeable_landing_companies');

        let can_upgrade_to = [];
        let type;
        if ((upgradeable_landing_companies || []).length) {
            const current_landing_company = get('landing_company_shortcode');

            // only show upgrade message to landing companies other than current
            const canUpgrade = (...landing_companies) => {
                const result = landing_companies.filter(landing_company => (
                    landing_company !== current_landing_company &&
                    upgradeable_landing_companies.indexOf(landing_company) !== -1
                ));

                return result.length ? result : [];
            };

            can_upgrade_to = canUpgrade('iom', 'svg', 'malta', 'maltainvest');
            if (can_upgrade_to.length) {
                type = can_upgrade_to.map(
                    landing_company_shortcode => landing_company_shortcode === 'maltainvest' ? 'financial' : 'real',
                );
            }
        }

        return {
            type,
            can_upgrade   : !!can_upgrade_to.length,
            can_upgrade_to,
            can_open_multi: false,
        };
    };

    // API_V3: send a list of accounts the client can transfer to
    const canTransferFunds = (account) => {
        if (account) {
            // this specific account can be used to transfer funds to
            return canTransferFundsTo(account.loginid);
        }
        // single account can be used to transfer funds to
        return current_account.loginid && canTransferFundsTo(current_account.loginid);
    };

    const canTransferFundsTo = () => false; // Simplified for single account - no transfers between accounts in pure session token system

    const hasSvgAccount = () => current_account.loginid && /^CR/.test(current_account.loginid);

    const canChangeCurrency = (statement, is_current = true) => {
        const currency             = get('currency');
        const has_no_transaction   = (statement.count === 0 && statement.transactions.length === 0);

        // Current API requirements for currently logged-in user successfully changing their account's currency:
        // 1. User must not have made any transactions
        // 2. Not be a crypto account
        // 3. Not be a virtual account
        return is_current ? currency && !get('is_virtual') && has_no_transaction && !isCryptocurrency(currency) : has_no_transaction;
    };

    const isMF = () => {
        const landing_company_shortcode  = get('landing_company_shortcode') || State.getResponse('landing_company.gaming_company.shortcode');
        return landing_company_shortcode === 'maltainvest';
    };

    const isMultipliersOnly = () => {
        const multipliers_only_countries = ['de', 'es', 'it', 'lu', 'gr', 'au', 'fr'];
        const country = get('country') || State.getResponse('authorize.country');
        return multipliers_only_countries.includes(country);
    };
    // Restrict binary options display on clients with Australian and French residence
    const isOptionsBlocked = () => {
        const options_blocked_countries = ['au', 'fr'];
        const country = get('country') || State.getResponse('authorize.country');
        return options_blocked_countries.includes(country);
    };

    const isOfferingBlocked = () => {
        const options_blocked_countries = ['gb', 'im'];
        const country = get('country') || State.getResponse('authorize.country');
        return options_blocked_countries.includes(country);
    };

    const isHighRisk = () => {
        const landing_companies = State.getResponse('landing_company');

        if (landing_companies) {
            let financial_company_shortcode, gaming_company_shortcode;
            if (landing_companies.financial_company) {
                financial_company_shortcode = landing_companies.financial_company.shortcode;
            }
            if (landing_companies.gaming_company) {
                gaming_company_shortcode = landing_companies.gaming_company.shortcode;
            }
            const financial_restricted_countries = financial_company_shortcode === 'svg' && !gaming_company_shortcode;

            const CFDs_restricted_countries = gaming_company_shortcode === 'svg' && !financial_company_shortcode;
            
            const restricted_countries =
                financial_company_shortcode === 'svg' ||
                (gaming_company_shortcode === 'svg' && financial_company_shortcode !== 'maltainvest');
                
            const high_risk = financial_company_shortcode === 'svg' && gaming_company_shortcode === 'svg';
            return high_risk || restricted_countries || financial_restricted_countries || CFDs_restricted_countries;
        }

        return false;
    };

    const isLowRisk = () => {
        const landing_companies = State.getResponse('landing_company');
        const upgradeable_landing_companies = State.getResponse('authorize.upgradeable_landing_companies');
        if (landing_companies || upgradeable_landing_companies) {
            const financial_company_shortcode = landing_companies.financial_company.shortcode;
            let gaming_company_shortcode;
            if (landing_companies.gaming_company) {
                gaming_company_shortcode = landing_companies.gaming_company.shortcode;
            }
            const low_risk_landing_company = financial_company_shortcode === 'maltainvest' && gaming_company_shortcode === 'svg';
            return low_risk_landing_company || (upgradeable_landing_companies.include('svg') && upgradeable_landing_companies.include('maltainvest'));
        }

        return false;
    };

    /**
     * Get session token if it exists
     * @returns {string|null} - Session token or null if not found
     */
    const getStoredSessionToken = () => localStorage.getItem('session_token');

    return {
        init,
        isLoggedIn,
        isMF,
        isMultipliersOnly,
        set,
        get,
        setTotalBalance,
        getTotalBalance,
        isHighRisk,
        isLowRisk,
        isOptionsBlocked,
        isOfferingBlocked,
        hasCurrencyType,
        hasOnlyCurrencyType,
        responseAuthorizeSessionToken,
        clearAllAccounts,
        setNewAccount,
        currentLandingCompany,
        getCurrentAccount,
        getMT5AccountDisplays,
        getBasicUpgradeInfo,
        canTransferFunds,
        hasSvgAccount,
        canChangeCurrency,
        getStoredSessionToken,
    };
})();

module.exports = ClientBase;
