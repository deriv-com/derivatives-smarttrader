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
                    {accounts && accounts.map((account) => (
                        <div
                            key={account.loginid}
                            className='acc-dropdown__account-wrapper'
                            onClick={() =>
                                onAccountSelect(account.loginid, account.is_virtual)
                            }
                        >
                            <div
                                className={classNames('acc-dropdown__account', {
                                    'acc-dropdown__account--selected':
                    account.loginid === activeAccountId,
                                })}
                            >
                                <div
                                    className={classNames('acc-dropdown__account-name', {
                                        'acc-dropdown__account-name--demo':
                      account.is_virtual === 1,
                                        'acc-dropdown__account-name--real':
                      account.is_virtual !== 1,
                                    })}
                                >
                                    {account.is_virtual === 1 ? 'Demo account' : 'Real account'}
                                </div>
                                <div className='acc-dropdown__account-balance'>
                                    {account.loginid === activeAccountId && activeAccount ? (
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
            balance   : PropTypes.number.isRequired,
            currency  : PropTypes.string,
            is_virtual: PropTypes.oneOfType([PropTypes.number, PropTypes.bool]).isRequired,
            loginid   : PropTypes.string.isRequired,
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
