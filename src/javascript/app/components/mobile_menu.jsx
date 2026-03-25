import React, { useState, useEffect } from 'react';
import {
    StandaloneGlobeRegularIcon,
    StandaloneCircleQuestionRegularIcon,
    StandaloneChevronRightRegularIcon,
    StandaloneChevronLeftRegularIcon,
    StandaloneRightFromBracketRegularIcon,
    StandaloneFileLinesRegularIcon,
    StandaloneFileChartColumnRegularIcon,
    StandaloneClockThreeRegularIcon,
} from '@deriv/quill-icons';
import { localize } from '@deriv-com/translations';
import Client from '../base/client';
import { useApp } from '../contexts/AppContext';
import {
    getPlatformHostname,
    getHelpCentreUrl,
} from '../../../templates/_common/brand.config';
import { getAccountType } from '../../config';
import Url from '../../_common/url';

/**
 * MenuItem - Reusable menu row with icon, label, and optional chevron
 */
const MenuItem = ({ icon, label, onClick, href }) => {
    const content = (
        <>
            <span className='mobile-menu__item-icon'>{icon}</span>
            <span className='mobile-menu__item-label'>{label}</span>
            <StandaloneChevronRightRegularIcon iconSize='sm' />
        </>
    );

    if (href) {
        return (
            <a className='mobile-menu__item' href={href}>
                {content}
            </a>
        );
    }

    return (
        <div className='mobile-menu__item' onClick={onClick}>
            {content}
        </div>
    );
};

/**
 * LanguageSubmenu - Full-page language selector
 */
const LanguageSubmenu = ({ onBack, onLanguageSelect, availableLanguages, currentLanguage }) => (
    <div className='mobile-menu__submenu'>
        <div className='mobile-menu__submenu-header' onClick={onBack}>
            <StandaloneChevronLeftRegularIcon />
            <span>{localize('Language')}</span>
        </div>
        <div className='mobile-menu__language-list'>
            {availableLanguages.map((lang) => (
                <div
                    key={lang.code}
                    className={`mobile-menu__language-item${
                        currentLanguage === lang.code ? ' mobile-menu__language-item--active' : ''
                    }`}
                    onClick={() => onLanguageSelect(lang.code)}
                >
                    <span className='mobile-menu__language-text'>{lang.name}</span>
                </div>
            ))}
        </div>
    </div>
);

/**
 * MainMenuContent - Settings and Support sections
 */
const MainMenuContent = ({ onLanguageClick, onLogoutClick }) => {
    const { isLoggedIn } = useApp();
    const account_type = getAccountType();

    const handleHelpCentreClick = () => {
        window.open(getHelpCentreUrl(), '_blank', 'noopener,noreferrer');
    };
    const redirect_url = getPlatformHostname();

    return (
        <div className='mobile-menu__content'>
            {isLoggedIn && (
                <div className='mobile-menu__section'>
                    <div className='mobile-menu__section-title'>{localize('Reports')}</div>
                    <MenuItem
                        icon={<StandaloneClockThreeRegularIcon iconSize='sm' />}
                        label={localize('Open positions')}
                        href={Url.urlForReports('reports/positions', redirect_url, account_type)}
                    />
                    <MenuItem
                        icon={<StandaloneFileChartColumnRegularIcon iconSize='sm' />}
                        label={localize('Trade table')}
                        href={Url.urlForReports('reports/profit', redirect_url, account_type)}
                    />
                    <MenuItem
                        icon={<StandaloneFileLinesRegularIcon iconSize='sm' />}
                        label={localize('Statement')}
                        href={Url.urlForReports('reports/statement', redirect_url, account_type)}
                    />
                </div>
            )}

            <div className='mobile-menu__section'>
                <div className='mobile-menu__section-title'>{localize('Settings')}</div>
                <MenuItem
                    icon={<StandaloneGlobeRegularIcon iconSize='sm' />}
                    label={localize('Language')}
                    onClick={onLanguageClick}
                />
            </div>

            <div className='mobile-menu__section'>
                <div className='mobile-menu__section-title'>{localize('Support')}</div>
                <MenuItem
                    icon={<StandaloneCircleQuestionRegularIcon iconSize='sm' />}
                    label={localize('Help centre')}
                    onClick={handleHelpCentreClick}
                />
            </div>

            {isLoggedIn && (
                <div className='mobile-menu__section'>
                    <div
                        className='mobile-menu__item mobile-menu__item--logout'
                        onClick={onLogoutClick}
                    >
                        <span className='mobile-menu__item-icon'>
                            <StandaloneRightFromBracketRegularIcon iconSize='sm' />
                        </span>
                        <span className='mobile-menu__item-label'>{localize('Log out')}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

/**
 * MobileMenuComponent - Full-page mobile menu
 */
const MobileMenuComponent = () => {
    const {
        activeTab,
        setActiveTab,
        availableLanguages,
        handleLanguageChange,
        currentLanguage,
    } = useApp();
    const [activeSubmenu, setActiveSubmenu] = useState(null);

    const isMenuOpen = activeTab === 'menu';

    useEffect(() => {
        if (isMenuOpen) {
            document.body.classList.add('stop-scrolling');
        } else {
            document.body.classList.remove('stop-scrolling');
            setActiveSubmenu(null);
        }

        return () => {
            document.body.classList.remove('stop-scrolling');
        };
    }, [isMenuOpen]);

    const handleLogout = () => {
        setActiveTab('trade');
        Client.sendLogoutRequest();
    };

    const handleLanguageSelect = async (langCode) => {
        await handleLanguageChange(langCode);
    };

    if (!isMenuOpen) return null;

    return (
        <div className='mobile-menu'>
            {!activeSubmenu && (
                <MainMenuContent
                    onLanguageClick={() => setActiveSubmenu('language')}
                    onLogoutClick={handleLogout}
                />
            )}

            {activeSubmenu === 'language' && (
                <LanguageSubmenu
                    onBack={() => setActiveSubmenu(null)}
                    onLanguageSelect={handleLanguageSelect}
                    availableLanguages={availableLanguages}
                    currentLanguage={currentLanguage}
                />
            )}
        </div>
    );
};

export default MobileMenuComponent;
