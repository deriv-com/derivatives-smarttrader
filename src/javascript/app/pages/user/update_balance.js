const PortfolioInit         = require('./account/portfolio/portfolio.init');
const updateTotal           = require('./update_total');
const TopUpVirtualPopup     = require('./account/top_up_virtual/pop_up');
const updateContractBalance = require('../trade/update_values').updateContractBalance;
const Client                = require('../../base/client');
const BinarySocket          = require('../../base/socket');
const Header                = require('../../base/header');
const formatMoney           = require('../../common/currency').formatMoney;
const getPropertyValue      = require('../../../_common/utility').getPropertyValue;
const createElement         = require('../../../_common/utility').createElement;
const localize              = require('../../../_common/localize').localize;

const updateBalance = (response) => {
    // eslint-disable-next-line no-console
    console.log('💰 updateBalance called with:', {
        hasResponse: !!response,
        hasBalance : !!response?.balance,
        hasError   : !!getPropertyValue(response, 'error'),
        balance    : response?.balance,
        error      : getPropertyValue(response, 'error'),
    });
    
    if (getPropertyValue(response, 'error')) {
        // eslint-disable-next-line no-console
        console.log('💰 updateBalance: Early return due to error');
        return;
    }

    function waitForReadyElement(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                return;
            }
    
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
    
            observer.observe(document.body, {
                childList: true,
                subtree  : true,
            });
        });
    }

    BinarySocket.wait('website_status').then(() => {
        const { accounts, balance, currency, loginid, total } = response.balance;
        
        // eslint-disable-next-line no-console
        console.log('💰 Balance data extracted:', {
            accounts,
            balance,
            currency,
            loginid,
            total,
            currentLoginId: Client.get('loginid'),
        });
        
        if (!currency) {
            // eslint-disable-next-line no-console
            console.log('💰 updateBalance: No currency, returning early');
            return;
        }
        const updateBalanceByAccountId = async (account_id, updated_balance, account_currency) => {
            const el_balance_span = await waitForReadyElement(`.account__switcher-balance-${account_id}`);
            const reset_button    = createElement('button', { text: localize('Reset balance'), class: 'account__switcher-balance btn btn--secondary btn__small reset_btn' });

            if (el_balance_span) {
                const display_balance = formatMoney(account_currency, updated_balance);

                el_balance_span.innerHTML = display_balance;

                const is_virtual = /^VRT/.test(account_id);
                const is_current = Client.get('loginid') === account_id;

                // show reset button
                if (updated_balance !== 10000 && is_virtual && is_current && !Client.hasWalletsAccount()) {
                    el_balance_span.innerHTML = null;
                    el_balance_span.appendChild(reset_button);
                    reset_button.addEventListener('click', (e) => {
                        e.preventDefault();
                        TopUpVirtualPopup.doTopUp();
                    });
                }

                if (is_current) {
                    // eslint-disable-next-line no-console
                    console.log('🎯 Updating header balance for current account:', {
                        account_id,
                        display_balance,
                        updated_balance,
                        account_currency,
                        headerElement: !!document.getElementById('header__acc-balance'),
                    });
                    
                    const headerElement = document.getElementById('header__acc-balance');
                    if (headerElement) {
                        headerElement.innerHTML = display_balance;
                        // eslint-disable-next-line no-console
                        console.log('✅ Header balance updated successfully:', display_balance);
                    } else {
                        // eslint-disable-next-line no-console
                        console.error('❌ Header balance element not found!');
                    }
                    
                    Client.set('balance', updated_balance);
                    PortfolioInit.updateBalance();
                }

                if (Client.hasWalletsAccount() && Header.getSelectedWalletId
                    && Header.getSelectedWalletId() === account_id) {
                    const header_balance_el = document.getElementById('header__acc-balance');
                    if (header_balance_el) {
                        header_balance_el.innerHTML = display_balance;
                    }
                }

                if (is_virtual) {
                    TopUpVirtualPopup.init(updated_balance);
                    updateTotal({
                        amount  : updated_balance,
                        currency: account_currency,
                        type    : 'virtual',
                    });
                } else {
                    const total_prop = is_virtual ? 'deriv_demo' : 'deriv';
                    
                    if (total[total_prop]) {
                        updateTotal({
                            amount  : total[total_prop].amount,
                            currency: total[total_prop].currency,
                            type    : is_virtual ? 'virtual' : 'real',
                        });
                    }
                }
            }
        };

        if (accounts) {
            if (!(loginid in accounts)) {
                updateBalanceByAccountId(loginid, balance, currency);
                Client.setTotalBalance(balance, currency);
                updateContractBalance(balance);
            }
            Object.keys(accounts).forEach(account_id => {
                const account = accounts[account_id];
                updateBalanceByAccountId(account_id, account.balance, account.currency);
            });
        } else if (loginid) {
            updateBalanceByAccountId(loginid, balance, currency);
            Client.setTotalBalance(balance, currency);
            updateContractBalance(balance);
        }

        if (updateBalance.resortTimeout) {
            clearTimeout(updateBalance.resortTimeout);
        }
        
        updateBalance.resortTimeout = setTimeout(() => {
            if (Header.resortAccountsByBalance) {
                Header.resortAccountsByBalance();
            }
            updateBalance.resortTimeout = null;
        }, 100);
    });
};

module.exports = updateBalance;
