import React, { useState } from 'react';
import {
    PartnersProductSmarttraderBrandLightLogoIcon,
    LegacyHomeNewIcon,
    StandaloneFileRegularIcon,
    StandaloneCircleQuestionRegularIcon,
    StandaloneGlobeRegularIcon,
    StandaloneGlobeFillIcon,
    StandaloneCircleUserRegularIcon,
    StandaloneCircleUserFillIcon,
} from '@deriv/quill-icons';
import { localize } from '@deriv-com/translations';
import Flyout from './flyout';
import SidebarLanguageSelector from './sidebar-language-selector';
import SidebarAccountSelector from './sidebar-account-selector';
import { useApp } from '../contexts/AppContext';
import {
    getBrandHomeUrl,
    getHelpCentreUrl,
    getPlatformHostname,
} from '../../../templates/_common/brand.config';
import { getAccountType } from '../../config';
import Language from '../../_common/language';
import Url from '../../_common/url';

const SidebarComponent = () => {
    const { isLoggedIn } = useApp();
    const [activeFlyout, setActiveFlyout] = useState(null);

    const account_type = getAccountType();
    const redirect_url = getPlatformHostname();

    const toggleFlyout = (type) => {
        setActiveFlyout((prev) => (prev === type ? null : type));
    };

    const closeFlyout = () => {
        setActiveFlyout(null);
    };

    const handleHomeClick = () => {
        closeFlyout();
        window.location.href = `${getBrandHomeUrl()}?lang=${Language.get()}`;
    };

    const handleReportsClick = () => {
        closeFlyout();
        window.location.href = Url.urlForReports('reports', redirect_url, account_type);
    };

    const handleHelpClick = () => {
        closeFlyout();
        window.open(getHelpCentreUrl(), '_blank', 'noopener,noreferrer');
    };

    const isLanguageActive = activeFlyout === 'language';
    const isAccountActive = activeFlyout === 'account';

    const navigationItems = [
        {
            id      : 'home',
            icon    : <LegacyHomeNewIcon iconSize='xs' />,
            label   : localize('Home'),
            onClick : handleHomeClick,
            isActive: false,
            show    : true,
        },
        {
            id      : 'reports',
            icon    : <StandaloneFileRegularIcon iconSize='sm' />,
            label   : localize('Reports'),
            onClick : handleReportsClick,
            isActive: false,
            show    : isLoggedIn,
        },
    ];

    const utilityItems = [
        {
            id      : 'help',
            icon    : <StandaloneCircleQuestionRegularIcon iconSize='sm' />,
            label   : localize('Help'),
            onClick : handleHelpClick,
            isActive: false,
            show    : true,
        },
        {
            id  : 'language',
            icon: isLanguageActive
                ? <StandaloneGlobeFillIcon iconSize='sm' />
                : <StandaloneGlobeRegularIcon iconSize='sm' />,
            label   : localize('Language'),
            onClick : () => toggleFlyout('language'),
            isActive: isLanguageActive,
            show    : true,
        },
        {
            id  : 'account',
            icon: isAccountActive
                ? <StandaloneCircleUserFillIcon iconSize='sm' />
                : <StandaloneCircleUserRegularIcon iconSize='sm' />,
            label   : localize('Account'),
            onClick : () => toggleFlyout('account'),
            isActive: isAccountActive,
            show    : isLoggedIn,
        },
    ];

    const getFlyoutContent = () => {
        switch (activeFlyout) {
            case 'language':
                return {
                    title  : localize('Language'),
                    content: <SidebarLanguageSelector onLanguageChange={closeFlyout} />,
                    footer : null,
                };
            case 'account':
                return {
                    title  : localize('Account'),
                    content: <SidebarAccountSelector onClose={closeFlyout} />,
                    footer : null,
                };
            default:
                return null;
        }
    };

    const flyoutContent = getFlyoutContent();

    return (
        <>
            <aside className='sidebar' data-testid='dt_sidebar'>
                {/* Logo */}
                <div className='sidebar__header'>
                    <PartnersProductSmarttraderBrandLightLogoIcon height='32px' width='32px' />
                </div>
                <div className='sidebar__separator' />

                {/* Navigation */}
                <nav className='sidebar__nav'>
                    <div className='sidebar__nav-main'>
                        {navigationItems.map((item) => {
                            if (!item.show) return null;
                            return (
                                <button
                                    key={item.id}
                                    className={`sidebar__item${item.isActive ? ' sidebar__item--active' : ''}`}
                                    onClick={item.onClick}
                                    data-testid={`dt_sidebar_${item.id}`}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <span className='sidebar__item-icon'>{item.icon}</span>
                                    <span className='sidebar__item-label'>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Utility */}
                    <div className='sidebar__nav-utility'>
                        <div className='sidebar__separator' />
                        {utilityItems.map((item) => {
                            if (!item.show) return null;
                            return (
                                <button
                                    key={item.id}
                                    className={`sidebar__item${item.isActive ? ' sidebar__item--active' : ''}`}
                                    onClick={item.onClick}
                                    data-testid={`dt_sidebar_${item.id}`}
                                    aria-label={item.label}
                                    type='button'
                                >
                                    <span className='sidebar__item-icon'>{item.icon}</span>
                                    <span className='sidebar__item-label'>{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </aside>

            {/* Flyout panel */}
            <Flyout
                is_open={activeFlyout !== null}
                onClose={closeFlyout}
                title={flyoutContent?.title}
                footer_content={flyoutContent?.footer}
            >
                {flyoutContent?.content}
            </Flyout>
        </>
    );
};

export default SidebarComponent;
