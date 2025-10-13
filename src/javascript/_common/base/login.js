// Login functionality redirects to Deriv dashboard
// SmartTrader now uses token-based authentication (oneTimeToken -> sessionToken -> authorize)

const Login = (() => {
    const redirectToLogin = () => {
        // Redirect to Deriv dashboard login
        window.location.href = 'https://home.deriv.com/dashboard/login';
    };

    const redirectToSignup = () => {
        // Redirect to Deriv dashboard signup
        window.location.href = 'https://home.deriv.com/dashboard/signup';
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
