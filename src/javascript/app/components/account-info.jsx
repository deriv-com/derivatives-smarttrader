import React, { useState, useRef } from 'react';
import { Skeleton } from '@deriv-com/quill-ui';
import { LegacyChevronDown1pxIcon } from '@deriv/quill-icons';
import AccountDropdown from './account-dropdown';
// import AccountSwitcherTooltip, { TOOLTIP_SHOWN_KEY } from './account-switcher-tooltip';
import { useApp } from '../contexts/AppContext';
import useOutsideClick from '../hooks/useOutsideClick';

/**
 * AccountInfo - Displays account icon, type, and balance
 */
const AccountInfo = () => {
    const {
        accountInfo,
        derivativesAccountInfo,
        getFormattedBalance,
        getAccountTypeDisplay,
        refetchDerivativesAccountSilently,
    } = useApp();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef(null);

    // // Check if tooltip should be shown
    // useEffect(() => {
    // // Check if tooltip has been shown before
    //     const hasBeenShownBefore =
    //   localStorage.getItem(TOOLTIP_SHOWN_KEY) === 'true';

    //     // Only show tooltip if it hasn't been shown before AND there are at least 2 accounts
    //     const shouldShow =
    //   !hasBeenShownBefore &&
    //   derivativesAccountInfo?.data &&
    //   Array.isArray(derivativesAccountInfo.data) &&
    //   derivativesAccountInfo.data.length >= 2;

    //     setShowTooltip(shouldShow);
    // }, [derivativesAccountInfo?.data]);

    // // Handler to close the tooltip and save to localStorage
    // const handleCloseTooltip = () => {
    //     localStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
    //     setShowTooltip(false);
    // };

    // Show loading skeleton for entire account info until we have data from authorize
    const isLoading =
    typeof accountInfo.balance === 'undefined' ||
    !accountInfo.loginid ||
    derivativesAccountInfo.loading;

    const toggleDropdown = () => {
        const newState = !isDropdownOpen;
        setIsDropdownOpen(newState);

        // If opening the dropdown, refresh the accounts data silently
        if (newState) {
            refetchDerivativesAccountSilently();
        }
    };

    // Handle outside clicks to close the dropdown
    useOutsideClick(dropdownRef, () => {
        if (isDropdownOpen) {
            setIsDropdownOpen(false);
        }
    });

    return (
        <>
            <div className='acc-info__wrapper' ref={dropdownRef}>
                <div className='account-info-wrapper'>
                    {isLoading ? (
                        <div
                            data-testid='dt_acc_info mobile-hide'
                            id='dt_core_account-info_acc-info'
                            className='acc-info'
                        >
                            <div className='acc-info__content'>
                                <div className='acc-info__account-type-header'>
                                    <Skeleton.Square width={60} height={16} />
                                </div>
                                <div className='acc-info__balance-section'>
                                    <Skeleton.Square width={100} height={20} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            data-testid='dt_acc_info'
                            id='dt_core_account-info_acc-info'
                            className='acc-info'
                        >
                            <span className='acc-info__id' />
                            <div
                                className={`acc-info__content${derivativesAccountInfo?.data?.length > 1 ? ' acc-info__content--clickable' : ''}`}
                                onClick={derivativesAccountInfo?.data?.length > 1 ? toggleDropdown : undefined}
                            >
                                <div className='acc-info__account-type-header'>
                                    <p
                                        id='header__acc-type'
                                        className={`acc-info__account-type${
                                            getAccountTypeDisplay().toLowerCase().includes('demo')
                                                ? ' acc-info__account-type--virtual'
                                                : ''
                                        }`}
                                    >
                                        <span className='acc-info__account-label'>
                                            {getAccountTypeDisplay()}
                                        </span>
                                        {derivativesAccountInfo &&
                                        derivativesAccountInfo?.data?.length > 1 && (
                                            <span
                                                className={`acc-info__select-arrow ${isDropdownOpen ? 'acc-info__select-arrow--active' : ''}`}
                                            >
                                                <LegacyChevronDown1pxIcon iconSize='xs' />
                                            </span>
                                        )}
                                    </p>
                                    <AccountDropdown
                                        accounts={derivativesAccountInfo.data}
                                        activeAccountId={accountInfo.loginid}
                                        activeAccount={accountInfo}
                                        isVisible={isDropdownOpen}
                                        setIsDropdownOpen={setIsDropdownOpen}
                                        onAccountSelect={(account_id, account_type) => {
                                            setIsDropdownOpen(false);

                                            // Set account_id and account_type in URL to trigger account switch
                                            const url = new URL(window.location.href);
                                            url.searchParams.set('account_id', account_id);
                                            url.searchParams.set('account_type', account_type);

                                            // Navigate to new URL which will trigger the account change mechanism
                                            window.location.href = url.toString();
                                        }}
                                    />
                                </div>
                                <div className='acc-info__balance-section'>
                                    <p
                                        data-testid='dt_balance'
                                        id='header__acc-balance'
                                        className='acc-info__balance'
                                    >
                                        {getFormattedBalance()}
                                        <span className='symbols'>
                                            {' '}
                                            {accountInfo.currency || 'USD'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* <AccountSwitcherTooltip
                isVisible={showTooltip}
                onClose={handleCloseTooltip}
            /> */}
        </>
    );
};

export default AccountInfo;
