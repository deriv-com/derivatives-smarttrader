import React, { useState, useRef, useEffect } from 'react';
import { Skeleton, Button } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import { StandaloneChevronDownRegularIcon } from '@deriv/quill-icons';
import AccountDropdown from './account-dropdown';
import AccountSwitcherTooltip, {
    TOOLTIP_SHOWN_KEY,
} from './account-switcher-tooltip';
import MobileMenuComponent from './mobile_menu';
import LanguageMenuModal from '../../../templates/_common/components/language-menu-modal';
import CompleteProfileModalModule from '../../../templates/_common/components/complete-profile-modal';
import { renderReactComponent } from '../../_common/react_root_manager';
import { getElementById } from '../../_common/common_functions';
import Url from '../../_common/url';
import Login from '../../_common/base/login';
import Language from '../../_common/language';
import { AppProvider, useApp } from '../contexts/AppContext';
import useOutsideClick from '../hooks/useOutsideClick';
import {
    getBrandHomeUrl,
    getBrandUrl,
    getPlatformHostname,
} from '../../../templates/_common/brand.config';
import { getAccountType } from '../../config';

const BUILD_HASH = process.env.BUILD_HASH || '';

/**
 * HeaderLeft - Left section of header with logo and reports link
 */
const HeaderLeft = () => {
    const { isLoggedIn, toggleMobileMenu } = useApp();

    // Get URL parameters for Reports link
    const account_type = getAccountType();
    const redirect_url = getPlatformHostname();

    return (
        <div className='header__menu-left'>
            <span className='header__hamburger--container'>
                <img
                    id='header__hamburger'
                    className='header__hamburger mobile-show'
                    src={Url.urlForStatic(
                        `images/pages/header/ic-hamburger.svg?${BUILD_HASH}`,
                    )}
                    alt='Menu'
                    onClick={toggleMobileMenu}
                    style={{ cursor: 'pointer' }}
                />
            </span>
            {isLoggedIn && (
                <div className='mobile-show'>
                    <AccountInfo />
                </div>
            )}
            <div className='header__menu-item header__menu-links  client_logged_in mobile-hide'>
                <a
                    className='url-reports-positions header__menu-links-item home-icon'
                    href={`${getBrandHomeUrl()}?lang=${Language.get()}`}
                >
                    <span className='header__menu-item--label'>
                        <img
                            className='header__icon-text reports-icon'
                            src={Url.urlForStatic(
                                `images/pages/header/deriv-com-logo.svg?${BUILD_HASH}`,
                            )}
                            alt='Deriv Home'
                        />
                        <span>{localize('Home')}</span>
                    </span>
                </a>
            </div>
            {isLoggedIn && (
                <div className='header__menu-item header__menu-links  client_logged_in mobile-hide'>
                    <a
                        className='url-reports-positions header__menu-links-item'
                        href={Url.urlForReports(
                            'reports/positions',
                            redirect_url,
                            account_type,
                        )}
                    >
                        <span className='header__menu-item--label'>
                            <img
                                className='header__icon-text reports-icon'
                                src={Url.urlForStatic(
                                    `images/pages/header/ic-reports.svg?${BUILD_HASH}`,
                                )}
                                alt=''
                            />
                            <span>{localize('Reports')}</span>
                        </span>
                    </a>
                </div>
            )}
        </div>
    );
};

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
    const [showTooltip, setShowTooltip] = useState(false);
    const dropdownRef = useRef(null);

    // Check if tooltip should be shown
    useEffect(() => {
    // Check if tooltip has been shown before
        const hasBeenShownBefore =
      localStorage.getItem(TOOLTIP_SHOWN_KEY) === 'true';

        // Only show tooltip if it hasn't been shown before AND there are at least 2 accounts
        const shouldShow =
      !hasBeenShownBefore &&
      derivativesAccountInfo?.data &&
      Array.isArray(derivativesAccountInfo.data) &&
      derivativesAccountInfo.data.length >= 2;

        setShowTooltip(shouldShow);
    }, [derivativesAccountInfo?.data]);

    // Handler to close the tooltip and save to localStorage
    const handleCloseTooltip = () => {
        localStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
        setShowTooltip(false);
    };

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
                            onClick={toggleDropdown}
                        >
                            <span className='acc-info__id' />
                            <div className='acc-info__content'>
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
                                                <StandaloneChevronDownRegularIcon
                                                    fill='#000000'
                                                    width={20}
                                                    height={20}
                                                />
                                            </span>
                                        )}
                                    </p>
                                    <AccountDropdown
                                        accounts={derivativesAccountInfo.data}
                                        activeAccountId={accountInfo.loginid}
                                        activeAccount={accountInfo}
                                        isVisible={isDropdownOpen}
                                        setIsDropdownOpen={setIsDropdownOpen}
                                        onAccountSelect={(loginid, is_virtual) => {
                                            setIsDropdownOpen(false);

                                            // Set account_id and account_type in URL to trigger account switch
                                            const account_type = is_virtual ? 'demo' : 'real';
                                            const url = new URL(window.location.href);
                                            url.searchParams.set('account_id', loginid);
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
            <AccountSwitcherTooltip
                isVisible={showTooltip}
                onClose={handleCloseTooltip}
            />
        </>
    );
};

/**
 * LoginButtons - Login and signup buttons with skeleton loaders
 */
const LoginButtons = () => {
    const { isLoading } = useApp();

    const handleLogin = (e) => {
        e.preventDefault();
        Login.redirectToLogin();
    };

    const handleSignup = (e) => {
        e.preventDefault();
        Login.redirectToSignup();
    };

    // Show skeleton loaders during token exchange
    if (isLoading || window.tokenExchangeInProgress) {
        return (
            <div className='header__btn'>
                <div className='skeleton-loaders-container'>
                    <Skeleton.Square
                        width={72}
                        height={32}
                        className='btn header__btn-login skeleton-btn-login'
                    />
                    <Skeleton.Square
                        width={72}
                        height={32}
                        className='btn header__btn-login skeleton-btn-signup'
                    />
                </div>
            </div>
        );
    }

    return (
        <div className='header__btn'>
            <a
                id='btn__login'
                className='btn btn--tertiary header__btn-login'
                onClick={handleLogin}
                href='#'
            >
                {localize('Log in')}
            </a>
            <a
                id='btn__signup'
                className='btn btn--primary header__btn-signup'
                onClick={handleSignup}
                href='#'
            >
                {localize('Sign up')}
            </a>
        </div>
    );
};

/**
 * Helper function to check if user has only demo accounts
 */
const hasOnlyDemoAccounts = (accountList) => {
    if (!accountList || accountList.length === 0) return false;

    // Check if all accounts have is_virtual flag set to 1
    return accountList.every((account) => account.is_virtual === 1);
};

/**
 * HeaderRight - Right section with account info or login buttons
 */
const HeaderRight = () => {
    const { isLoggedIn, accountInfo, derivativesAccountInfo } = useApp();

    // Function to show Complete Profile modal
    const showCompleteProfileModal = () => {
        const lang_param = Language.get() ? `&lang=${Language.get()}` : '';
        const onboardingUrl = `${getBrandUrl()}/onboarding/personal-details?from=home&source=options${lang_param}`;

        CompleteProfileModalModule.init({
            title     : localize('Complete your profile setup'),
            message   : localize('Finish setting up your profile to continue.'),
            buttonText: localize('Complete setup'),
            onClose   : () => CompleteProfileModalModule.remove(),
            onComplete: () => {
                window.location.href = onboardingUrl;
            },
        });
    };

    if (isLoggedIn) {
        const hasCurrency = accountInfo.currency && accountInfo.currency !== '';
        const hasOnlyDemo = hasOnlyDemoAccounts(derivativesAccountInfo.data);

        return (
            <div className='header__menu-right client_logged_in'>
                <div className='mobile-hide'>
                    <AccountInfo />
                </div>
                {!hasCurrency || derivativesAccountInfo.loading ? (
                    <Skeleton.Square
                        width={100}
                        height={32}
                        className='btn header__btn-transfer'
                    />
                ) : (
                    <Button
                        id={hasOnlyDemo ? 'btn__try-real' : 'btn__transfer'}
                        className='btn header__btn-transfer'
                        variant='primary'
                        size='md'
                        label={localize(hasOnlyDemo ? 'Try Real' : 'Transfer')}
                        onClick={() => {
                            if (hasOnlyDemo) {
                                showCompleteProfileModal();
                            } else {
                                const lang_param = Language.get()
                                    ? `&lang=${Language.get()}`
                                    : '';
                                window.location.href = `${getBrandUrl()}/transfer?acc=options&from=home&source=options${`&curr=${accountInfo.currency}`}${lang_param}`;
                            }
                        }}
                    />
                )}
            </div>
        );
    }

    return (
        <div className='header__menu-right is-logout'>
            <LoginButtons />
        </div>
    );
};

/**
 * HeaderComponent - Main header component
 */
const HeaderComponent = () => (
    <div className='header' id='regular__header'>
        <div id='deriv__header' className='header__menu-items'>
            <HeaderLeft />
            <HeaderRight />
        </div>
        <MobileMenuComponent />
    </div>
);

export const init = () => {
    const container = getElementById('header-container');
    if (container) {
        renderReactComponent(
            <AppProvider>
                <>
                    <HeaderComponent />
                    <LanguageMenuModal />
                </>
            </AppProvider>,
            container,
        );
    }
};

export default init;
