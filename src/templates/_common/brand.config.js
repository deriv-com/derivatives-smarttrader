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
            staging   : 'staging.derivatives-smarttrader.pages.dev',
            production: 'derivatives-smarttrader.pages.dev',
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
    ? `https://${brand_config_data.platform.hostname.production}`
    : `https://${brand_config_data.platform.hostname.staging}`;

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
};
