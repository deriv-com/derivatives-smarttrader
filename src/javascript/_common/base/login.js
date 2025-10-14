// Login functionality redirects to Deriv dashboard
// SmartTrader now uses token-based authentication (oneTimeToken -> sessionToken -> authorize)

const { getBrandLoginUrl, getBrandSignupUrl } = require('../../../templates/_common/brand.config');

const Login = (() => {
    const redirectToLogin = () => {
        window.location.href = getBrandLoginUrl();
    };

    const redirectToSignup = () => {
        window.location.href = getBrandSignupUrl();
    };

    const initOneAll = () => {
        // Social login is handled by the Deriv dashboard
        // This is kept for backward compatibility but does nothing
    };

    return {
        redirectToLogin,
        redirectToSignup,
        initOneAll,
    };
})();

module.exports = Login;
