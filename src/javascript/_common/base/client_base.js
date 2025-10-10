const moment                       = require('moment');
const Cookies                      = require('js-cookie');
const isCryptocurrency             = require('./currency_base').isCryptocurrency;
const SocketCache                  = require('./socket_cache');
const localize                     = require('../localize').localize;
const LocalStore                   = require('../storage').LocalStore;
const SessionStore                 = require('../storage').SessionStore;
const State                        = require('../storage').State;
const getPropertyValue             = require('../utility').getPropertyValue;
const isEmptyObject                = require('../utility').isEmptyObject;

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

    const getAccountType = (loginid = current_loginid) => {
        let account_type;
        if (/^VR/.test(loginid))          account_type = 'virtual';
        else if (/^MF/.test(loginid))     account_type = 'financial';
        else if (/^MLT|MX/.test(loginid)) account_type = 'gaming';
        return account_type;
    };

    const isAccountOfType = (type, loginid = current_loginid, only_enabled = false) => {
        const this_type   = getAccountType(loginid);
        return ((
            (type === 'virtual' && this_type === 'virtual') ||
            (type === 'real'    && this_type !== 'virtual') ||
            type === this_type) &&
            (only_enabled ? !get('is_disabled') : true));
    };

    const getAccountOfType = (type, only_enabled) => {
        const loginid = current_account.loginid;
        return (loginid && isAccountOfType(type, loginid, only_enabled)) ?
            Object.assign({ loginid }, current_account) : {};
    };

    const hasAccountType = (type, only_enabled) => !isEmptyObject(getAccountOfType(type, only_enabled));

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

    const TypesMapConfig = (() => {
        let types_map_config;

        const initTypesMap = () => ({
            default  : localize('Real'),
            financial: localize('Investment'),
            gaming   : localize('Gaming'),
            virtual  : localize('Virtual'),
        });

        return {
            get: () => {
                if (!types_map_config) {
                    types_map_config = initTypesMap();
                }
                return types_map_config;
            },
        };
    })();

    const getAccountTitle = loginid => {
        const types_map = TypesMapConfig.get();
        return (types_map[getAccountType(loginid)] || types_map.default);
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
    };

    const shouldAcceptTnc = () => {
        if (get('is_virtual')) return false;
        const website_tnc_version = State.getResponse('website_status.terms_conditions_version');
        const client_tnc_status   = State.getResponse('get_settings.client_tnc_status');
        return typeof client_tnc_status !== 'undefined' && client_tnc_status !== website_tnc_version;
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

    const shouldCompleteTax = () => isAccountOfType('financial') &&
        !/crs_tin_information/.test((State.getResponse('get_account_status') || {}).status);

    const isAuthenticationAllowed = () => {
        const { status, authentication } = State.getResponse('get_account_status');
        const has_allow_document_upload = /allow_document_upload/.test(status);
        const has_verification_flags = authentication.needs_verification.length;
        return has_allow_document_upload || has_verification_flags;
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
        const landing_company_obj = State.getResponse('landing_company');

        let can_open_multi = false;
        let can_upgrade_to = [];
        let type;
        if ((upgradeable_landing_companies || []).length) {
            const current_landing_company = get('landing_company_shortcode');
            let allowed_currencies = [];
            if (current_loginid) {
                allowed_currencies = getLandingCompanyValue(current_loginid, landing_company_obj, 'legal_allowed_currencies');
            }
            // create multiple accounts only available for landing companies with legal_allowed_currencies
            can_open_multi = !!(upgradeable_landing_companies.indexOf(current_landing_company) !== -1 &&
            (allowed_currencies && allowed_currencies.length));

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
            can_upgrade: !!can_upgrade_to.length,
            can_upgrade_to,
            can_open_multi,
        };
    };

    const getLandingCompanyValue = (loginid, landing_company, key) => {
        let landing_company_object;
        if (loginid.financial || isAccountOfType('financial', loginid)) {
            landing_company_object = getPropertyValue(landing_company, 'financial_company');
        } else if (loginid.real || isAccountOfType('real', loginid)) {
            landing_company_object = getPropertyValue(landing_company, 'gaming_company');

            // handle accounts that don't have gaming company
            if (!landing_company_object) {
                landing_company_object = getPropertyValue(landing_company, 'financial_company');
            }
        } else {
            const financial_company = (getPropertyValue(landing_company, 'financial_company') || {})[key] || [];
            const gaming_company    = (getPropertyValue(landing_company, 'gaming_company') || {})[key] || [];

            landing_company_object = Array.isArray(financial_company) ?
                financial_company.concat(gaming_company)
                :
                $.extend({}, financial_company, gaming_company);

            return landing_company_object;
        }
        return (landing_company_object || {})[key];
    };

    const getRiskAssessment = () => {
        const status = State.getResponse('get_account_status.status');

        return (
            isAccountOfType('financial') ?
                /(financial_assessment|trading_experience)_not_complete/.test(status) :
                /financial_assessment_not_complete/.test(status)
        );
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

    const canChangeCurrency = (statement, mt5_login_list, is_current = true) => {
        const currency             = get('currency');
        const has_no_mt5           = !mt5_login_list || !mt5_login_list.length;
        const has_no_transaction   = (statement.count === 0 && statement.transactions.length === 0);
        const has_account_criteria = has_no_transaction && has_no_mt5;

        // Current API requirements for currently logged-in user successfully changing their account's currency:
        // 1. User must not have made any transactions
        // 2. User must not have any MT5 account
        // 3. Not be a crypto account
        // 4. Not be a virtual account
        return is_current ? currency && !get('is_virtual') && has_account_criteria && !isCryptocurrency(currency) : has_account_criteria;
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
        const risk_classification = State.getResponse('get_account_status.risk_classification');

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
            return high_risk || restricted_countries || risk_classification === 'high' || financial_restricted_countries || CFDs_restricted_countries;
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
        getAccountType,
        isAccountOfType,
        isAuthenticationAllowed,
        isHighRisk,
        isLowRisk,
        isOptionsBlocked,
        isOfferingBlocked,
        getAccountOfType,
        hasAccountType,
        hasCurrencyType,
        hasOnlyCurrencyType,
        getAccountTitle,
        responseAuthorizeSessionToken,
        shouldAcceptTnc,
        clearAllAccounts,
        setNewAccount,
        currentLandingCompany,
        shouldCompleteTax,
        getCurrentAccount,
        getMT5AccountDisplays,
        getBasicUpgradeInfo,
        getLandingCompanyValue,
        getRiskAssessment,
        canTransferFunds,
        hasSvgAccount,
        canChangeCurrency,
        getStoredSessionToken,
    };
})();

module.exports = ClientBase;
