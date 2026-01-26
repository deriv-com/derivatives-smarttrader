const PortfolioInit         = require('./account/portfolio/portfolio.init');
const updateContractBalance = require('../trade/update_values').updateContractBalance;
const Client                = require('../../base/client');
const getPropertyValue      = require('../../../_common/utility').getPropertyValue;
// Global balance update event for React components to listen to
const BALANCE_UPDATED_EVENT = 'balance_updated';

// [AI]
const updateBalance = (response) => {
    if (getPropertyValue(response, 'error')) {
        return;
    }

    const { balance, currency, loginid, is_virtual } = response.balance;

    if (!currency || !loginid) {
        return;
    }

    const is_current_account = Client.get('loginid') === loginid;

    if (!is_current_account) {
        return;
    }

    // Update header balance display using DOM manipulation for non-React elements

    // Dispatch a custom event that React components can listen to
    const balanceData = {
        currency,
        balance,
        loginid,
        accountType: is_virtual ? 'Virtual' : 'Real',
    };

    // Dispatch event for React components to pick up
    document.dispatchEvent(
        new CustomEvent(BALANCE_UPDATED_EVENT, { detail: balanceData }),
    );

    // Update client balance data
    Client.set('balance', balance);
    Client.setTotalBalance(balance, currency);

    // Update portfolio and contract balance
    PortfolioInit.updateBalance();
    updateContractBalance(balance);

    // Note: TopUpVirtualPopup removed - account management functionality disabled
    // Note: updateTotal removed - single-account mode doesn't need total balance aggregation
};

module.exports = {
    updateBalance,
    BALANCE_UPDATED_EVENT,
};
