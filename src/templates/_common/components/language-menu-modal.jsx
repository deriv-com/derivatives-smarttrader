import React, { useState, useEffect } from 'react';
import { localize } from '@deriv-com/translations';
import Url from '../../../javascript/_common/url';
import { useApp } from '../../../javascript/app/contexts/AppContext';

const BUILD_HASH = process.env.BUILD_HASH || '';

const LanguageMenuModal = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { availableLanguages, handleLanguageChange, currentLanguage } = useApp();

    useEffect(() => {
        // Set up visibility control via global function
        window.toggleLanguagePopup = () => {
            setIsVisible(prev => !prev);
        };

        // Clean up on unmount
        return () => {
            if (window.toggleLanguagePopup) {
                delete window.toggleLanguagePopup;
            }
        };
    }, []);

    const handleClose = () => {
        setIsVisible(false);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleLanguageSelect = (langCode) => {
        handleLanguageChange(langCode);
    };

    return (
        <div
            id='language-menu-modal'
            className={isVisible ? '' : 'invisible'}
            onClick={handleBackdropClick}
        >
            <div id='language-menu'>
                <div id='language-menu-header'>
                    <span>{localize('Language settings')}</span>
                    <span id='language-menu-close_btn' onClick={handleClose} />
                </div>
                <div id='language-menu-container'>
                    <div id='language-menu-list'>
                        {availableLanguages.map(lang => (
                            <div
                                key={lang.code}
                                className={`language-menu-item${
                                    currentLanguage === lang.code ? ' language-menu-item__active' : ''
                                }`}
                                onClick={() => handleLanguageSelect(lang.code)}
                            >
                                <img
                                    src={Url.urlForStatic(
                                        `images/languages/ic-flag-${lang.flag}.svg?${BUILD_HASH}`
                                    )}
                                    alt={lang.name}
                                />
                                <span>{lang.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LanguageMenuModal;
