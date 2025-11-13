import React from 'react';
import { Skeleton } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import MobileMenuComponent from './mobile_menu';
import LanguageMenuModal from '../../../templates/_common/components/language-menu-modal';
import { renderReactComponent } from '../../_common/react_root_manager';
import { getElementById } from '../../_common/common_functions';
import Url from '../../_common/url';
import Login from '../../_common/base/login';
import Client from '../base/client';
import { AppProvider, useApp } from '../contexts/AppContext';
import { getBrandHomeUrl, getPlatformHostname } from '../../../templates/_common/brand.config';
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
                    src={Url.urlForStatic(`images/pages/header/ic-hamburger.svg?${BUILD_HASH}`)}
                    alt='Menu'
                    onClick={toggleMobileMenu}
                    style={{ cursor: 'pointer' }}
                />
            </span>
            <div className='header-menu-item header-menu-links'>
                <a className='url-deriv-com' href={getBrandHomeUrl()}>
                    <img
                        className='deriv-com-logo'
                        src={Url.urlForStatic(`images/pages/header/deriv-com-logo.svg?${BUILD_HASH}`)}
                        alt='Deriv'
                    />
                </a>
            </div>
            <div className='header-divider is-logout mobile-hide' />
            {isLoggedIn && (
                <div className='header__menu-item header__menu-links client_logged_in mobile-hide'>
                    <a
                        className='url-reports-positions header__menu-links-item'
                        href={Url.urlForReports('reports/positions', redirect_url, account_type)}
                    >
                        <span className='header__menu-item--label'>
                            <img
                                className='header__icon-text reports-icon'
                                src={Url.urlForStatic(`images/pages/header/ic-reports.svg?${BUILD_HASH}`)}
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
    const { accountInfo, getFormattedBalance, getAccountTypeDisplay } = useApp();

    // Get account icon based on currency
    const getAccountIcon = () => {
        // Show default USD icon until actual currency is available
        const currency = accountInfo.currency ? accountInfo.currency.toLowerCase() : 'usd';
        return Url.urlForStatic(`images/pages/header/ic-currency-${currency}.svg?${BUILD_HASH}`);
    };

    return (
        <div className='acc-info__wrapper'>
            <div className='acc-info__separator mobile-hide' />
            <div className='account-info-wrapper'>
                <div data-testid='dt_acc_info' id='dt_core_account-info_acc-info' className='acc-info'>
                    <span className='acc-info__id'>
                        <span className='acc-info__id-icon'>
                            <img
                                id='header__acc-icon'
                                className='header__acc-icon'
                                src={getAccountIcon()}
                                alt={accountInfo.currency || 'USD'}
                            />
                        </span>
                    </span>
                    <div className='acc-info__content'>
                        <div className='acc-info__account-type-header'>
                            <p id='header__acc-type' className='acc-info__account-type'>
                                {getAccountTypeDisplay()}
                            </p>
                        </div>
                        <div className='acc-info__balance-section'>
                            <p
                                data-testid='dt_balance'
                                id='header__acc-balance'
                                className='acc-info__balance'
                            >
                                {getFormattedBalance()}
                                <span className='symbols'> {accountInfo.currency || 'USD'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
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
                    <Skeleton.Square width={72} height={32} className='btn header__btn-login skeleton-btn-login' />
                    <Skeleton.Square width={72} height={32} className='btn header__btn-login skeleton-btn-signup' />
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
 * HeaderRight - Right section with account info or login buttons
 */
const HeaderRight = () => {
    const { isLoggedIn } = useApp();

    const handleLogout = (e) => {
        e.preventDefault();
        Client.sendLogoutRequest();
    };

    if (isLoggedIn) {
        return (
            <div className='header__menu-right client_logged_in'>
                <div className='header__divider mobile-hide' />
                <AccountInfo />
                <div className='header__divider mobile-hide' />
                <a
                    id='btn__logout'
                    className='btn header__btn-logout logout mobile-hide'
                    onClick={handleLogout}
                    href='#'
                >
                    {localize('Log out')}
                </a>
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
            container
        );
    }
};

export default init;
