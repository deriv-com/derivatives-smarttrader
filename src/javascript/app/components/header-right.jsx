import React from 'react';
import { Skeleton, Button } from '@deriv-com/quill-ui';
import { localize } from '@deriv-com/translations';
import AccountInfo from './account-info';
import CompleteProfileModalModule from '../../../templates/_common/components/complete-profile-modal';
import Language from '../../_common/language';
import { useApp } from '../contexts/AppContext';
import {
    getBrandUrl,
} from '../../../templates/_common/brand.config';
import Login from '../../_common/base/login';

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
                <AccountInfo />
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

export default HeaderRight;
