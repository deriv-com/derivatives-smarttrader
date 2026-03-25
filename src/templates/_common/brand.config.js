const isProduction = process.env.NODE_ENV === 'production';

const brand_config_data = {
    brand_name    : 'Deriv',
    brand_logo    : 'deriv-com-logo.svg',
    brand_domains : ['deriv.com', 'deriv.be', 'deriv.me'],
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
        help_centre_url: 'https://trade.deriv.com/help-centre',
    },
    api_core: {
        staging   : 'staging-api-core.deriv.com',
        production: 'api-core.deriv.com',
    },
    auth: {
        staging   : 'staging-auth.deriv.com',
        production: 'auth.deriv.com',
    },
};

/**
 * Returns the SLD+TLD of the current page, e.g. "deriv.com", "deriv.be", "deriv.me".
 * Returns an empty string when window is unavailable (build/SSR context).
 */
const getDomainName = () => {
    if (typeof window === 'undefined') return '';
    const { hostname } = window.location;
    if (!hostname) return '';
    const parts = hostname.split('.');
    if (parts.length >= 2) {
        return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
    }
    return '';
};

/**
 * Replaces "deriv.com" in a URL with the current domain (e.g. deriv.be, deriv.me).
 * Returns the URL unchanged when running on localhost or an unrecognised hostname.
 */
const substituteDerivDomain = (url) => {
    const domain = getDomainName();
    if (!domain || !brand_config_data.brand_domains.includes(domain)) return url;
    try {
        // Parse the URL so we only rewrite the hostname — not query params or path segments
        const parsed = new URL(url);
        parsed.hostname = parsed.hostname.replace(/deriv\.com$/, domain);
        const result = parsed.toString();
        // Preserve trailing-slash behaviour of the original string
        return url.endsWith('/') ? result : result.replace(/\/$/, '');
    } catch {
        // Fallback for non-absolute strings (e.g. "api-core.deriv.com/options/v1/ws")
        return url.replace(/deriv\.com/, domain);
    }
};

const getBrandName = () => brand_config_data.brand_name;
const getBrandLogo = () => brand_config_data.brand_logo;
// Helper function to build brand URLs with environment and domain detection
const getBrandUrl = (path = '') => {
    const base = substituteDerivDomain(
        isProduction
            ? brand_config_data.brand_hostname.production
            : brand_config_data.brand_hostname.staging
    );
    return `https://${base}${path ? `/${path}` : ''}`;
};

const getBrandHomeUrl = () => getBrandUrl('home');
const getBrandLoginUrl = () => getBrandUrl('login');
const getBrandSignupUrl = () => getBrandUrl('signup');
const getPlatformName = () => brand_config_data.platform.name;
const getPlatformLogo = () => brand_config_data.platform.logo;
const getPlatformHostname = () => substituteDerivDomain(
    isProduction
        ? brand_config_data.platform.hostname.production
        : brand_config_data.platform.hostname.staging
);

const getWebSocketUrl = () => `${substituteDerivDomain(
    isProduction
        ? brand_config_data.api_core.production
        : brand_config_data.api_core.staging
)  }/options/v1/ws`;

const getWhoAmIURL = () => `https://${substituteDerivDomain(
    isProduction
        ? brand_config_data.auth.production
        : brand_config_data.auth.staging
)}/sessions/whoami`;

const getApiCoreUrl = (isProd) => substituteDerivDomain(
    isProd
        ? brand_config_data.api_core.production
        : brand_config_data.api_core.staging
);

const getHelpCentreUrl = () => substituteDerivDomain(brand_config_data.platform.help_centre_url);

const getLogoutURL = () => `https://${substituteDerivDomain(
    isProduction
        ? brand_config_data.auth.production
        : brand_config_data.auth.staging
)}/self-service/logout/browser`;

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
    getBrandUrl,
    getBrandHomeUrl,
    getBrandLoginUrl,
    getBrandSignupUrl,
    getPlatformName,
    getPlatformLogo,
    getPlatformHostname,
    getPlatformSettings, // Legacy compatibility
    getApiCoreUrl,
    getWebSocketUrl,
    getWhoAmIURL,
    getLogoutURL,
    getDomainName,
    substituteDerivDomain,
    getHelpCentreUrl,
};
