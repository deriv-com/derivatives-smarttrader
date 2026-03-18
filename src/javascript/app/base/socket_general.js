const { localize } = require('@deriv-com/translations');
const Client                 = require('./client');
const Clock                  = require('./clock');
const Header                 = require('./header');
const BinarySocket           = require('./socket');
const { updateBalance }          = require('../pages/user/update_balance');
const GTM                    = require('../../_common/base/gtm');
const { mapErrorMessage }    = require('../../_common/error_mapper');
const SubscriptionManager    = require('../../_common/base/subscription_manager').default;
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
            case 'balance':
                // NEW SYSTEM: Balance response is the auth confirmation
                if (response.error) {
                    const is_active_tab = sessionStorage.getItem('active_tab') === '1';
                    showNoticeMessage(mapErrorMessage(response.error));
                    localStorage.removeItem('account_id');
                    localStorage.removeItem('account_type');

                    if (is_active_tab) {
                        sessionStorage.removeItem('active_tab');
                    }
                    Client.sendLogoutRequest(is_active_tab);
                } else if (!isLoginPages() && !/balance/.test(State.get('skip_response'))) {
                    // Check if this is the first balance (auth confirmation)
                    const isFirstBalance = !Client.get('loginid');

                    if (isFirstBalance) {
                        // First balance response - set up subscriptions
                        Client.responseBalance(response);
                        SubscriptionManager.subscribe('transaction', { transaction: 1, subscribe: 1 }, () => false);
                        BinarySocket.sendBuffered();
                        LocalStore.remove('date_first_contact');
                        LocalStore.remove('signup_device');
                    }

                    // Always update balance display
                    updateBalance(response);
                }
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
                showNoticeMessage(mapErrorMessage(response.error));
                break;
            }
            case 'RateLimit':
                Header.displayNotification(localize('You have reached the rate limit of requests per second. Please try later.'), true, 'RATE_LIMIT');
                break;
            case 'InvalidAppID':
                //  Header.displayNotification(response.error.message, true, 'INVALID_APP_ID');
                Header.displayNotification({ key: 'invalid_app_id', title: localize('Invalid app id'), message: mapErrorMessage(response.error), type: 'danger' });
                break;
            case 'DisabledClient':
                showNoticeMessage(mapErrorMessage(response.error));
                break;
      // no default
        }
    };

    const showNoticeMessage = (text) => {
        $('#content').empty().html($('<div/>', { class: 'container' }).append($('<p/>', { class: 'notice-msg center-text', text })));
    };

    const onConnectionError = () => {
        localStorage.removeItem('active_loginid');
        localStorage.removeItem('account_id');
        localStorage.removeItem('account_type');
        localStorage.removeItem('current_account');

        showNoticeMessage(localize('Connection failed. Please refresh this page to continue.'));
    };

    return {
        onOpen,
        onMessage,
        onConnectionError,
    };
})();

module.exports = BinarySocketGeneral;
