const PortfolioInit         = require('./account/portfolio/portfolio.init');
const updateContractBalance = require('../trade/update_values').updateContractBalance;
const Client                = require('../../base/client');
const formatMoney           = require('../../common/currency').formatMoney;
const getPropertyValue      = require('../../../_common/utility').getPropertyValue;

// [AI]
const updateBalance = (response) => {
    if (getPropertyValue(response, 'error')) {
        return;
    }

    const { balance, currency, loginid } = response.balance;
    
    if (!currency || !loginid) {
        return;
    }

    const is_current_account = Client.get('loginid') === loginid;
    
    if (!is_current_account) {
        return;
    }

    // Update header balance display
    const display_balance = formatMoney(currency, balance);
    
    const headerElement = document.getElementById('header__acc-balance');
    if (headerElement) {
        headerElement.innerHTML = display_balance;
    }
    
    // Update client balance data
    Client.set('balance', balance);
    Client.setTotalBalance(balance, currency);
    
    // Update portfolio and contract balance
    PortfolioInit.updateBalance();
    updateContractBalance(balance);
    
    // Note: TopUpVirtualPopup removed - account management functionality disabled
    // Note: updateTotal removed - single-account mode doesn't need total balance aggregation
};

module.exports = updateBalance;
