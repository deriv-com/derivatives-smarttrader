import React, { createContext, useContext, useState, useEffect } from 'react';
import { localize } from '@deriv-com/translations';
import Client from '../base/client';
import BinarySocket from '../../_common/base/socket_base';
import { formatMoney } from '../../_common/base/currency_base';
import { getAccountType } from '../../config';
import Language from '../../_common/language';

// Create the context
const AppContext = createContext(null);

/**
 * AppProvider - Manages application-wide state
 *
 * Provides:
 * - Authentication state (isLoggedIn)
 * - Account information (currency, balance, loginid, accountType)
 * - Language configuration (currentLanguage, availableLanguages)
 * - Mobile menu state (isMobileMenuOpen)
 * - Loading states
 * - Helper functions (getFormattedBalance, handleLanguageChange, etc.)
 */
const AppProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(Client.isLoggedIn());
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [accountInfo, setAccountInfo] = useState({
        currency   : '',
        balance    : undefined,
        loginid    : '',
        accountType: '',
    });

    // Centralized language configuration - used by both desktop and mobile
    const [currentLanguage] = useState(() => Language.get());
    const [availableLanguages] = useState(() => {
        const allLanguages = Language.getAll();
        const allowedLanguages = Language.getAllowedLanguages();

        // Map language codes to display format with flags
        return allowedLanguages.map((code) => ({
            code,
            name: allLanguages[code],
            flag: code.toLowerCase(),
        }));
    });

    // Note: Balance subscription is already done automatically in socket_base.js
    // We just need to listen for balance updates via the second useEffect below

    // Subscribe to balance updates (balance is the auth confirmation in new API)
    useEffect(() => {
        const handleBalance = (response) => {
            if (!response || response.msg_type !== 'balance' || !response.balance) {
                return;
            }

            if (response.balance) {
                const balance = response.balance;
                setIsLoggedIn(true);
                setAccountInfo({
                    currency   : balance.currency || '',
                    balance    : balance.balance || 0,
                    loginid    : balance.loginid || '',
                    accountType: getAccountType() || '',
                });
                setIsLoading(false);

                // Clear token exchange flag if it exists
                if (window.tokenExchangeInProgress) {
                    window.tokenExchangeInProgress = false;
                }
            }
        };

        // Listen for balance responses (auth confirmation)
        BinarySocket.wait('balance').then(handleBalance);
    }, []);

    // Helper function to format balance
    const getFormattedBalance = () =>
        formatMoney(accountInfo.currency || 'USD', accountInfo.balance || 0, true);

    // Helper function to get account type display name
    const getAccountTypeDisplay = () => {
        if (!isLoggedIn) return '';
        const accountType = getAccountType();
        // Directly pass either "Demo account" or "Real account" to localize
        return accountType === 'demo'
            ? localize('Demo account')
            : localize('Real account');
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen((prev) => !prev);
    };

    // Close mobile menu
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    // Handle language change
    const handleLanguageChange = async (langCode) => {
        try {
            await Language.changeSelectedLanguage(langCode);
            return true;
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to change language:', error);
            return false;
        }
    };

    const value = {
        isLoggedIn,
        isLoading,
        accountInfo,
        isMobileMenuOpen,
        currentLanguage,
        availableLanguages,
        getFormattedBalance,
        getAccountTypeDisplay,
        setIsLoading,
        toggleMobileMenu,
        closeMobileMenu,
        handleLanguageChange,
    };

    return React.createElement(AppContext.Provider, { value }, children);
};

/**
 * useApp - Custom hook to access app context
 *
 * @returns {Object} App context value
 * @throws {Error} If used outside AppProvider
 */
const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export { AppProvider, useApp };
