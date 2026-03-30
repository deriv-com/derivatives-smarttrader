import React from 'react';
import { Skeleton, Button } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import { PartnersProductSmarttraderBrandLightLogoIcon } from '@deriv/quill-icons';
import AccountInfo from './account-info';
import MobileMenuComponent from './mobile_menu';
import BottomNavComponent from './bottom_nav';
import SidebarComponent from './sidebar';
import LanguageMenuModal from '../../../templates/_common/components/language-menu-modal';
import CompleteProfileModalModule from '../../../templates/_common/components/complete-profile-modal';
import { renderReactComponent } from '../../_common/react_root_manager';
import { getElementById } from '../../_common/common_functions';
import Url from '../../_common/url';
import Login from '../../_common/base/login';
import Language from '../../_common/language';
import { AppProvider, useApp } from '../contexts/AppContext';
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
    const { isLoggedIn } = useApp();

    // Get URL parameters for Reports link
    const account_type = getAccountType();
    const redirect_url = getPlatformHostname();

    return (
        <div className='header__menu-left'>
            <span className='header__logo mobile-show'>
                <PartnersProductSmarttraderBrandLightLogoIcon height='32px' width='32px' />
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
 * LoginButtons - Login and signup buttons with skeleton loaders
 */
const LoginButtons = () => {
    const { isLoading } = useApp();

    const handleLogin = (e) => {
        e.preventDefault();
        Login.redirectToLogin();
    };

    // Show skeleton loader during token exchange
    if (isLoading || window.tokenExchangeInProgress) {
        return (
            <div className='header__btn'>
                <div className='skeleton-loaders-container'>
                    <Skeleton.Square
                        width={72}
                        height={32}
                        className='btn header__btn-login skeleton-btn-login'
                    />
                </div>
            </div>
        );
    }

    return (
        <div className='header__btn'>
            <Button
                id='btn__login'
                className='header__btn-login'
                variant='primary'
                size='md'
                label={localize('Log in')}
                onClick={handleLogin}
            />
        </div>
    );
};

/**
 * Helper function to check if user has only demo accounts
 */
const hasOnlyDemoAccounts = (accountList) => {
    if (!accountList || accountList.length === 0) return false;

    // Check if all accounts are demo
    return accountList.every((account) => account.account_type === 'demo');
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
                        id={hasOnlyDemo ? 'btn__try-real' : 'btn__deposit'}
                        className='btn header__btn-transfer'
                        variant='primary'
                        size='md'
                        label={hasOnlyDemo ? localize('Try Real') : localize('Deposit')}
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
// eslint-disable-next-line no-unused-vars
const HeaderComponent = () => (
    <div className='header' id='regular__header'>
        <div id='deriv__header' className='header__menu-items'>
            <HeaderLeft />
            <HeaderRight />
        </div>
    </div>
);

export const init = () => {
    const container = getElementById('header-container');
    if (container) {
        renderReactComponent(
            <AppProvider>
                <>
                    <SidebarComponent />
                    <HeaderComponent />
                    <LanguageMenuModal />
                    <MobileMenuComponent />
                    <BottomNavComponent />
                </>
            </AppProvider>,
            container,
        );
    }

};

export default init;
