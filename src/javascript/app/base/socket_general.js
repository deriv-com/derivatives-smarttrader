const Client                 = require('./client');
const Clock                  = require('./clock');
const Header                 = require('./header');
const BinarySocket           = require('./socket');
const Dialog                 = require('../common/attach_dom/dialog');

const SessionDurationLimit   = require('../common/session_duration_limit');
const updateBalance          = require('../pages/user/update_balance');
const GTM                    = require('../../_common/base/gtm');

const SubscriptionManager    = require('../../_common/base/subscription_manager').default;

const localize               = require('../../_common/localize').localize;
const LocalStore             = require('../../_common/storage').LocalStore;
const State                  = require('../../_common/storage').State;
const getPropertyValue       = require('../../_common/utility').getPropertyValue;
const isLoginPages           = require('../../_common/utility').isLoginPages;

const BinarySocketGeneral = (() => {
    const setupDefaultCurrencies = () => {
        // Set up default currencies since payout_currencies API is no longer available
        const defaultCurrencies = ['USD', 'EUR', 'GBP', 'AUD', 'BTC', 'ETH'];
        State.set(['response', 'payout_currencies'], defaultCurrencies);
    };

    const setupWebsiteStatusDefaults = () => {
        // Set up default website_status data since the API is no longer available
        // This provides essential data that the app expects
        const websiteStatusData = {
            clients_country         : 'ae', // Default to UAE (from your example)
            site_status             : 'up', // Assume site is always up
            supported_languages     : ['EN', 'ID', 'RU', 'MN', 'ES', 'FR', 'IT', 'PT', 'PL', 'DE', 'ZH_CN', 'VI', 'ZH_TW', 'TH', 'TR', 'KO', 'AR', 'BN', 'SI', 'SW', 'KM', 'UZ'],
            terms_conditions_version: 'Version 4.2.0 2020-08-07',
            currencies_config       : {
                'USD': { fractional_digits: 2, is_suspended: 0, name: 'US Dollar', type: 'fiat' },
                'EUR': { fractional_digits: 2, is_suspended: 0, name: 'Euro', type: 'fiat' },
                'GBP': { fractional_digits: 2, is_suspended: 0, name: 'Pound Sterling', type: 'fiat' },
                'AUD': { fractional_digits: 2, is_suspended: 0, name: 'Australian Dollar', type: 'fiat' },
                'BTC': { fractional_digits: 8, is_suspended: 0, name: 'Bitcoin', type: 'crypto' },
                'ETH': { fractional_digits: 8, is_suspended: 0, name: 'Ethereum', type: 'crypto' },
            },
        };
        State.set(['response', 'website_status'], websiteStatusData);
    };

    const onOpen = (is_ready) => {
        console.log('WebSocket onOpen called, is_ready:', is_ready);
        Header.hideNotification();
        
        // Set up default currencies since payout_currencies is no longer available
        setupDefaultCurrencies();
        
        // Set up default website_status data since the API is no longer available
        setupWebsiteStatusDefaults();
        
        // Start clock regardless of login status - clock should work for everyone
        console.log('Starting clock from onOpen...');
        Clock.startClock();
        
        if (is_ready) {
            if (!isLoginPages()) {
                if (!Client.isValidLoginid()) {
                    Client.sendLogoutRequest();
                    return;
                }
              
                // Send initial requests for logged-out users
                BinarySocket.send({ active_symbols: 'brief' });
            }
            
            // Send essential requests that replace website_status functionality
            // These are needed for basic app functionality
            BinarySocket.send({ residence_list: 1 }); // Get residence list for country detection
        }
    };

    const onMessage = (response) => {
        handleError(response);
        Header.hideNotification('CONNECTION_ERROR');
        switch (response.msg_type) {
            case 'authorize':
                if (response.error) {
                    const is_active_tab = sessionStorage.getItem('active_tab') === '1';
                    if (getPropertyValue(response, ['error', 'code']) === 'SelfExclusion' && is_active_tab) {
                        sessionStorage.removeItem('active_tab');
                        Dialog.alert({ id: 'authorize_error_alert', localized_message: response.error.message });
                    }
                    Client.sendLogoutRequest(is_active_tab);
                } else if (!isLoginPages() && !/authorize/.test(State.get('skip_response'))) {
                    const sessionToken = localStorage.getItem('session_token');
                    const isSessionTokenAuth = sessionToken && response.authorize;
                    const currentLoginId = Client.get('loginid');
                    
                    // Handle session token authentication (new user login via token exchange)
                    if (isSessionTokenAuth && !currentLoginId) {
                        Client.responseAuthorizeSessionToken(response);
                        BinarySocket.send({ balance: 1, subscribe: 1 });
                        BinarySocket.send({ get_settings: 1 });
                        BinarySocket.send({ get_account_status: 1 });
                        // [AI] payout_currencies removed - no longer supported in new API
                        BinarySocket.send({ mt5_login_list: 1 });
                        SubscriptionManager.subscribe('transaction', { transaction: 1, subscribe: 1 }, () => false);
                        const clients_country = response.authorize.country || Client.get('residence');
                        setResidence(clients_country);
                        // for logged in clients send landing company with IP address as residence
                        if (!clients_country) {
                            // [AI] website_status.clients_country no longer available, use landing_company.id instead
                            BinarySocket.send({ landing_company: State.getResponse('landing_company.id') });
                        }
                        if (!Client.get('is_virtual')) {
                            BinarySocket.send({ get_self_exclusion: 1 });
                        }
                        BinarySocket.sendBuffered();
                        LocalStore.remove('date_first_contact');
                        LocalStore.remove('signup_device');
                    } else if (response.authorize.loginid !== currentLoginId && !isSessionTokenAuth) {
                        // Don't logout during session token authentication - the loginid mismatch is expected
                        Client.sendLogoutRequest(true);
                    } else {
                        Client.responseAuthorize(response);
                        BinarySocket.send({ balance: 1, subscribe: 1 });
                        BinarySocket.send({ get_settings: 1 });
                        BinarySocket.send({ get_account_status: 1 });
                        // [AI] payout_currencies removed - no longer supported in new API
                        BinarySocket.send({ mt5_login_list: 1 });
                        SubscriptionManager.subscribe('transaction', { transaction: 1, subscribe: 1 }, () => false);
                        const clients_country = response.authorize.country || Client.get('residence');
                        setResidence(clients_country);
                        // for logged in clients send landing company with IP address as residence
                        if (!clients_country) {
                            // [AI] website_status.clients_country no longer available, use landing_company.id instead
                            BinarySocket.send({ landing_company: State.getResponse('landing_company.id') });
                        }
                        if (!Client.get('is_virtual')) {
                            BinarySocket.send({ get_self_exclusion: 1 });
                        }
                        BinarySocket.sendBuffered();
                        LocalStore.remove('date_first_contact');
                        LocalStore.remove('signup_device');
                    }
                }
                break;
            case 'balance':
                updateBalance(response);
                break;
            case 'logout':
                Client.doLogout(response);
                break;
            case 'landing_company':
                Header.upgradeMessageVisibility();
                break;
            case 'residence_list':
                // Store residence list for country detection
                if (response.residence_list) {
                    State.set(['response', 'residence_list'], response.residence_list);
                }
                break;
            case 'time':
                // Store time response for clock functionality
                if (response.time) {
                    State.set(['response', 'time'], response);
                }
                break;
            // [AI] payout_currencies handler removed - no longer supported in new API
            case 'get_self_exclusion':
                SessionDurationLimit.exclusionResponseHandler(response);
                break;
            case 'get_settings':
                if (response.get_settings) {
                    setResidence(response.get_settings.country_code);
                    Client.set('email', response.get_settings.email);
                    GTM.eventHandler(response.get_settings);
                    if (response.get_settings.is_authenticated_payment_agent) {
                        $('#topMenuPaymentAgent').setVisibility(1);
                    }
                }
                break;
            case 'transaction':
                GTM.pushTransactionData(response, { bom_ui: 'new' });
                break;
            // no default
        }
    };

    const setResidence = (residence) => {
        if (residence) {
            Client.set('residence', residence);
            BinarySocket.send({ landing_company: residence });
        }
    };

    const handleError = (response) => {
        const msg_type   = response.msg_type;
        const error_code = getPropertyValue(response, ['error', 'code']);
        switch (error_code) {
            case 'WrongResponse':
            case 'InternalServerError':
            case 'OutputValidationFailed': {
                if (msg_type !== 'mt5_login_list') {
                    showNoticeMessage(response.error.message);
                }
                break;
            }
            case 'RateLimit':
                Header.displayNotification(localize('You have reached the rate limit of requests per second. Please try later.'), true, 'RATE_LIMIT');
                break;
            case 'InvalidAppID':
                //  Header.displayNotification(response.error.message, true, 'INVALID_APP_ID');
                Header.displayNotification({ key: 'invalid_app_id', title: localize('Invalid app id'), message: response.error.message, type: 'danger' });
                break;
            case 'DisabledClient':
                showNoticeMessage(response.error.message);
                break;
            // no default
        }
    };

    const showNoticeMessage = (text) => {
        $('#content').empty().html($('<div/>', { class: 'container' }).append($('<p/>', { class: 'notice-msg center-text', text })));
    };

    return {
        onOpen,
        onMessage,
    };
})();

module.exports = BinarySocketGeneral;
