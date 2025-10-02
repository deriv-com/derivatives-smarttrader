const PortfolioInit         = require('./account/portfolio/portfolio.init');
const updateTotal           = require('./update_total');
const TopUpVirtualPopup     = require('./account/top_up_virtual/pop_up');
const updateContractBalance = require('../trade/update_values').updateContractBalance;
const Client                = require('../../base/client');
const BinarySocket          = require('../../base/socket');
const formatMoney           = require('../../common/currency').formatMoney;
const getPropertyValue      = require('../../../_common/utility').getPropertyValue;

const updateBalance = (response) => {
    if (getPropertyValue(response, 'error')) {
        return;
    }

    BinarySocket.wait('authorize').then(() => {
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
        
        // Handle virtual account top-up popup
        const is_virtual = /^VRT/.test(loginid);
        if (is_virtual) {
            TopUpVirtualPopup.init(balance);
        }
        
        // Update total balance display
        updateTotal({
            amount: balance,
            currency,
            type  : is_virtual ? 'virtual' : 'real',
        });
    });
};

module.exports = updateBalance;
