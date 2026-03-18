import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { getNumberFormat } from '../../_common/base/currency_base';

const AccountDropdown = ({
    accounts,
    activeAccountId,
    onAccountSelect,
    isVisible,
    activeAccount,
    setIsDropdownOpen,
}) => {
    const handleOverlayClick = () => {
        if (setIsDropdownOpen) {
            setIsDropdownOpen(false);
        }
    };

    if (!isVisible) return null;

    return (
        <>
            <div
                className='mobile-show acc-dropdown__overlay'
                onClick={handleOverlayClick}
            />
            <div className='acc-dropdown__container acc-dropdown__container--enter-done'>
                <div className='mobile-show acc-dropdown__drag-handle'>
                    <div className='acc-dropdown__drag-indicator' />
                </div>
                <div className='acc-dropdown__list'>
                    {accounts && [...accounts].sort((a, b) => {
                        if (a.account_type === 'real' && b.account_type === 'demo') return -1;
                        if (a.account_type === 'demo' && b.account_type === 'real') return 1;
                        return 0;
                    }).map((account) => (
                        <div
                            key={account.account_id}
                            className='acc-dropdown__account-wrapper'
                            onClick={() => {
                                if (account.account_id !== activeAccountId) {
                                    onAccountSelect(account.account_id, account.account_type);
                                }
                            }}
                        >
                            <div
                                className={classNames('acc-dropdown__account', {
                                    'acc-dropdown__account--selected':
                    account.account_id === activeAccountId,
                                })}
                            >
                                <div
                                    className={classNames('acc-dropdown__account-name', {
                                        'acc-dropdown__account-name--demo':
                      account.account_type === 'demo',
                                        'acc-dropdown__account-name--real':
                      account.account_type === 'real',
                                    })}
                                >
                                    {account.account_type === 'demo' ? 'Demo account' : 'Real account'}
                                </div>
                                <div className='acc-dropdown__account-balance'>
                                    {account.account_id === activeAccountId && activeAccount ? (
                                        <>
                                            {getNumberFormat(
                                                activeAccount.balance,
                                                activeAccount.currency,
                                            )}
                                            <span className='symbols'>
                                                {' '}
                                                {activeAccount.currency || 'USD'}
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {getNumberFormat(account.balance, account.currency)}
                                            <span className='symbols'>
                                                {' '}
                                                {account.currency || 'USD'}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

AccountDropdown.propTypes = {
   
    accounts: PropTypes.arrayOf(
        PropTypes.shape({
            account_id  : PropTypes.string.isRequired,
            account_type: PropTypes.string.isRequired,
            balance     : PropTypes.string.isRequired,
            currency    : PropTypes.string,
        })
    ).isRequired,
    activeAccount: PropTypes.shape({
        balance : PropTypes.number.isRequired,
        currency: PropTypes.string,
    }),
    activeAccountId  : PropTypes.string.isRequired,
    isVisible        : PropTypes.bool.isRequired,
    onAccountSelect  : PropTypes.func.isRequired,
    setIsDropdownOpen: PropTypes.func,
};

export default AccountDropdown;
