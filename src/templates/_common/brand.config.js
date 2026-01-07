const isProduction = process.env.NODE_ENV === 'production';

const brand_config_data = {
    brand_name    : 'Deriv',
    brand_logo    : 'deriv-com-logo.svg',
    brand_domain  : 'deriv.com',
    brand_hostname: {
        staging   : 'staging-home.deriv.com/dashboard',
        production: 'home.deriv.com/dashboard',
    },
    platform: {
        name    : 'Derivatives SmartTrader',
        logo    : 'logo_smart_trader.svg',
        hostname: {
            staging   : 'staging-dsmarttrader.deriv.com',
            production: 'dsmarttrader.deriv.com',
        },
        websocket: {
            staging   : 'staging-api-core.deriv.com/options/v1/ws',
            production: 'api-core.deriv.com/options/v1/ws',
        },
        whoami_endpoint: {
            staging   : 'https://staging-auth.deriv.com/sessions/whoami',
            production: 'https://auth.deriv.com/sessions/whoami',
        },
        logout_endpoint: {
            staging   : 'https://staging-auth.deriv.com/self-service/logout/browser',
            production: 'https://auth.deriv.com/self-service/logout/browser',
        },
    },
};

const getBrandName = () => brand_config_data.brand_name;
const getBrandLogo = () => brand_config_data.brand_logo;
const getBrandDomain = () => brand_config_data.brand_domain;
// Helper function to build brand URLs with environment detection
const getBrandUrl = (path = '') => {
    const hostname = isProduction
        ? brand_config_data.brand_hostname.production
        : brand_config_data.brand_hostname.staging;
    
    // Return complete URL with optional path
    return `https://${hostname}${path ? `/${path}` : ''}`;
};

const getBrandHomeUrl = () => getBrandUrl('home');
const getBrandLoginUrl = () => getBrandUrl('login');
const getBrandSignupUrl = () => getBrandUrl('signup');
const getPlatformName = () => brand_config_data.platform.name;
const getPlatformLogo = () => brand_config_data.platform.logo;
const getPlatformHostname = () => isProduction
    ? brand_config_data.platform.hostname.production
    : brand_config_data.platform.hostname.staging;

const getWebSocketUrl = () => isProduction
    ? brand_config_data.platform.websocket.production
    : brand_config_data.platform.websocket.staging;

const getWhoAmIURL = () => isProduction
    ? brand_config_data.platform.whoami_endpoint.production
    : brand_config_data.platform.whoami_endpoint.staging;

const getLogoutURL = () => isProduction
    ? brand_config_data.platform.logout_endpoint.production
    : brand_config_data.platform.logout_endpoint.staging;

// Legacy compatibility function - now returns smarttrader platform info
const getPlatformSettings = (platform_key) => {
    if (platform_key === 'smarttrader') {
        return {
            name: brand_config_data.platform.name,
            icon: brand_config_data.platform.logo,
        };
    }
    return null;
};

module.exports = {
    getBrandName,
    getBrandLogo,
    getBrandDomain,
    getBrandUrl,
    getBrandHomeUrl,
    getBrandLoginUrl,
    getBrandSignupUrl,
    getPlatformName,
    getPlatformLogo,
    getPlatformHostname,
    getPlatformSettings, // Legacy compatibility
    getWebSocketUrl,
    getWhoAmIURL,
    getLogoutURL,
};
