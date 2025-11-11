import React from 'react';
import { Skeleton } from '@deriv-com/quill-ui';
import MobileMenu from '../components/mobile_menu.jsx';

const Header = () => (
    <div className='header' id='regular__header'>
        <div id='deriv__header' className='header__menu-items'>
            <div className='header__menu-left'>
                <span className='header__hamburger--container'>
                    <img id='header__hamburger' className='header__hamburger mobile-show' />
                </span>
                <div className='header-menu-item header-menu-links'>
                    <a className='url-deriv-com'>
                        <img className='deriv-com-logo' />
                    </a>
                </div>
                <div className='header-divider is-logout mobile-hide' />
                <div className='header__menu-item header__menu-links client_logged_in invisible mobile-hide'>
                    <a className='url-reports-positions header__menu-links-item'>
                        <span className='header__menu-item--label'>
                            <img className='header__icon-text reports-icon' />
                            <span id='header__reports-text'>Reports</span>
                        </span>
                    </a>
                </div>
            </div>
            <div className='header__menu-right client_logged_in invisible'>
                <div className='header__divider mobile-hide' />
                {/* Modern account info structure matching bot project */}
                <div className='acc-info__wrapper'>
                    <div className='acc-info__separator mobile-hide' />
                    <div className='account-info-wrapper'>
                        <div data-testid='dt_acc_info' id='dt_core_account-info_acc-info' className='acc-info'>
                            <span className='acc-info__id'>
                                <span className='acc-info__id-icon'>
                                    <img id='header__acc-icon' className='header__acc-icon' />
                                </span>
                            </span>
                            <div className='acc-info__content'>
                                <div className='acc-info__account-type-header'>
                                    <p id='header__acc-type' className='acc-info__account-type'>Real</p>
                                </div>
                                <div className='acc-info__balance-section'>
                                    <p data-testid='dt_balance' id='header__acc-balance' className='acc-info__balance' />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className='header__divider mobile-hide' />
                {/* Desktop logout button */}
                <a id='btn__logout' className='btn header__btn-logout logout mobile-hide'>
                    Log out
                </a>
            </div>
            <div className='header__menu-right is-logout'>
                <div className='header__btn'>
                    {/* Skeleton loaders - only show during initial loading, hidden by default for session token users */}
                    <div id='skeleton-loaders-container' className='skeleton-loaders-container' style={{ display: 'none' }}>
                        <Skeleton.Square width={72} height={32} className='btn header__btn-login skeleton-btn-login' />
                        <Skeleton.Square width={72} height={32} className='btn header__btn-login skeleton-btn-signup' />
                    </div>
                            
                    <a id='btn__login' className='btn btn--tertiary header__btn-login' style={{ display: 'none' }}>Log in</a>
                    <a id='btn__signup' className='btn btn--primary header__btn-signup' style={{ display: 'none' }}>Sign up</a>
                </div>
            </div>
        </div>
        <MobileMenu />
    </div>
);

export default Header;
