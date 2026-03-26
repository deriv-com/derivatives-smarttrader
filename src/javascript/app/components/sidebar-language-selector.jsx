import React from 'react';
import { useApp } from '../contexts/AppContext';

const SidebarLanguageSelector = ({ onLanguageChange }) => {
    const { availableLanguages, currentLanguage, handleLanguageChange } = useApp();

    const onSelect = async (langCode) => {
        if (langCode === currentLanguage) return;
        await handleLanguageChange(langCode);
        if (onLanguageChange) onLanguageChange();
    };

    return (
        <div className='flyout-selector'>
            {availableLanguages.map((lang) => {
                const isActive = lang.code === currentLanguage;
                return (
                    <button
                        key={lang.code}
                        className={`flyout-selector__option${isActive ? ' flyout-selector__option--active' : ''}`}
                        onClick={() => onSelect(lang.code)}
                        disabled={isActive}
                        type='button'
                    >
                        <span>{lang.name}</span>
                    </button>
                );
            })}
        </div>
    );
};

export default SidebarLanguageSelector;
