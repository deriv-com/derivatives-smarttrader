const Client                 = require('./client');
const Clock                  = require('./clock');
const Header                 = require('./header');
const BinarySocket           = require('./socket');
const Dialog                 = require('../common/attach_dom/dialog');
const updateBalance          = require('../pages/user/update_balance');
const GTM                    = require('../../_common/base/gtm');
const SubscriptionManager    = require('../../_common/base/subscription_manager').default;
const localize               = require('../../_common/localize').localize;
const LocalStore             = require('../../_common/storage').LocalStore;
const State                  = require('../../_common/storage').State;
const getPropertyValue       = require('../../_common/utility').getPropertyValue;
const isLoginPages           = require('../../_common/utility').isLoginPages;

const BinarySocketGeneral = (() => {
    const onOpen = (is_ready) => {
        Header.hideNotification();
        if (is_ready) {
            Clock.startClock();
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
                    // Pure session token authentication - single path only
                    Client.responseAuthorizeSessionToken(response);
                    BinarySocket.send({ balance: 1, subscribe: 1 });
                    SubscriptionManager.subscribe('transaction', { transaction: 1, subscribe: 1 }, () => false);
                    BinarySocket.sendBuffered();
                    LocalStore.remove('date_first_contact');
                    LocalStore.remove('signup_device');
                }
                break;
            case 'balance':
                updateBalance(response);
                break;
            case 'logout':
                Client.doLogout(response);
                break;
            case 'transaction':
                GTM.pushTransactionData(response, { bom_ui: 'new' });
                break;
            // no default
        }
    };

    const handleError = (response) => {
        // Only process responses that actually have errors
        if (!response.error) {
            return;
        }
        
        const error_code = getPropertyValue(response, ['error', 'code']);
        switch (error_code) {
            case 'WrongResponse':
            case 'InternalServerError':
            case 'OutputValidationFailed': {
                showNoticeMessage(response.error.message);
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
