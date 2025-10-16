// const Cookies = require('js-cookie');

/*
 * Configuration values needed in js codes
 *
 * NOTE:
 * Please use the following command to avoid accidentally committing personal changes
 * git update-index --assume-unchanged src/javascript/config.js
 *
 */
const domain_app_ids = { // these domains also being used in '_common/url.js' as supported "production domains"
    'binary.com'                   : 1,
    'smarttrader.deriv.app'        : 22168,
    'smarttrader.deriv.com'        : 22168,
    'smarttrader.deriv.me'         : 27315,
    'smarttrader.deriv.be'         : 30768,
    'staging-smarttrader.deriv.be' : 31191,
    'staging-smarttrader.deriv.com': 22169,
    'binary.me'                    : 15284,
    'deriv.com'                    : 16929,
};

const getCurrentBinaryDomain = () =>
    Object.keys(domain_app_ids).find(domain => domain === window.location.hostname || `www.${domain}` === window.location.hostname);

const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => {
        const is_on_subdomain = domain.match(/\./g).length === 2;
        return `${!is_on_subdomain ? 'www\\.' : ''}${domain.replace(/\./g, '\\.')}`;
    });
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

const binary_desktop_app_id = 14473;

const getAppId = () => {
    let app_id = null;
    const user_app_id   = ''; // you can insert Application ID of your registered application here
    const config_app_id = window.localStorage.getItem('config.app_id');
    const is_new_app    = /\/app\//.test(window.location.pathname);
    
    if (config_app_id) {
        // eslint-disable-next-line no-console
        console.log('Using config_app_id:', config_app_id);
        app_id = config_app_id;
    } else if (/desktop-app/i.test(window.location.href) || window.localStorage.getItem('config.is_desktop_app')) {
        window.localStorage.removeItem('config.default_app_id');
        window.localStorage.setItem('config.is_desktop_app', 1);
        app_id = binary_desktop_app_id;
    } else if (/staging\.binary\.com/i.test(window.location.hostname)) {
        window.localStorage.removeItem('config.default_app_id');
        app_id = is_new_app ? 16303 : 1098;
    } else if (/smarttrader-staging\.deriv\.app/i.test(window.location.hostname)) { // TODO: [app-link-refactor] - Remove backwards compatibility for `deriv.app`
        window.localStorage.removeItem('config.default_app_id');
        app_id = 22169;
    } else if (/staging-smarttrader\.deriv\.com/i.test(window.location.hostname)) {
        window.localStorage.removeItem('config.default_app_id');
        app_id = 22169;
    } else if (/staging-smarttrader\.deriv\.app/i.test(window.location.hostname)) { // TODO: [app-link-refactor] - Remove backwards compatibility for `deriv.app`
        window.localStorage.removeItem('config.default_app_id');
        app_id = 22169;
    } else if (user_app_id.length) {
        window.localStorage.setItem('config.default_app_id', user_app_id); // it's being used in endpoint chrome extension - please do not remove
        app_id = user_app_id;
    } else if (/localhost/i.test(window.location.hostname)) {
        app_id = 23709;
    } else {
        window.localStorage.removeItem('config.default_app_id');
        const current_domain = getCurrentBinaryDomain();
        // TODO: remove is_new_app && deriv.com check when repos are split
        app_id = (is_new_app && current_domain !== 'deriv.com') ? 22168 : (domain_app_ids[current_domain] || 22168);
    }

    return app_id;
};

const isBinaryApp = () => +getAppId() === binary_desktop_app_id;

const getAccountType = () => {
    // Check URL parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const urlAccountType = urlParams.get('account_type');
    if (urlAccountType) {
        // Validate and store
        const validAccountType = ['demo', 'real'].includes(urlAccountType) ? urlAccountType : 'demo';
        window.localStorage.setItem('account_type', validAccountType);
        
        // Clean up URL
        const url = new URL(window.location);
        url.searchParams.delete('account_type');
        window.history.replaceState({}, '', url);

        return validAccountType;
    }
    
    // Check localStorage
    const storedAccountType = window.localStorage.getItem('account_type');
    if (storedAccountType && ['demo', 'real'].includes(storedAccountType)) {
        return storedAccountType;
    }
    
    // Default fallback
    return 'demo';
};

const getSocketURL = () => {
    let server_url = window.localStorage.getItem('config.server_url');
    
    if (!server_url) {
        // Get account type
        const accountType = getAccountType();
        // Map account type to new v2 endpoints
        server_url = accountType === 'real' ? 'realv2.derivws.com' : 'demov2.derivws.com';
    }
    
    return `wss://${server_url}/websockets/v3`;
};

module.exports = {
    getCurrentBinaryDomain,
    isProduction,
    getAppId,
    isBinaryApp,
    getAccountType,
    getSocketURL,
};
