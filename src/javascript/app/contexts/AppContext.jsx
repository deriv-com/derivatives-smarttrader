import React, { createContext, useContext, useState, useEffect } from 'react';
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
        currency   : Client.get('currency') || '',
        balance    : Client.get('balance'),
        loginid    : Client.get('loginid') || '',
        accountType: getAccountType() || '',
    });

    // Centralized language configuration - used by both desktop and mobile
    const [currentLanguage] = useState(() => Language.get());
    const [availableLanguages] = useState(() => {
        const allLanguages = Language.getAll();
        const allowedLanguages = Language.getAllowedLanguages();
        
        // Map language codes to display format with flags
        return allowedLanguages.map(code => ({
            code,
            name: allLanguages[code],
            flag: code.toLowerCase(),
        }));
    });

    // Update login state
    useEffect(() => {
        const checkAuthState = () => {
            const loggedIn = Client.isLoggedIn();
            setIsLoggedIn(loggedIn);
            
            if (loggedIn) {
                setAccountInfo({
                    currency   : Client.get('currency') || '',
                    balance    : Client.get('balance'),
                    loginid    : Client.get('loginid') || '',
                    accountType: getAccountType() || '',
                });
            } else {
                setAccountInfo({
                    currency   : '',
                    balance    : 0,
                    loginid    : '',
                    accountType: '',
                });
            }
        };

        // Check on mount
        checkAuthState();
    }, []);

    // Subscribe to balance updates via WebSocket
    useEffect(() => {
        if (!isLoggedIn) return;

        const subscribeToBalance = () => {
            // Wait for authorize response before subscribing to balance
            BinarySocket.wait('authorize').then(() => {
                BinarySocket.send({
                    balance  : 1,
                    subscribe: 1,
                }, {
                    callback: (response) => {
                        if (response.error) {
                            return;
                        }

                        if (response.balance) {
                            setAccountInfo(prev => ({
                                ...prev,
                                balance : response.balance.balance,
                                currency: response.balance.currency,
                            }));
                        }
                    },
                });
            });
        };

        subscribeToBalance();
    }, [isLoggedIn]);

    // Subscribe to authorize updates
    useEffect(() => {
        const handleAuthorize = (response) => {
            if (!response || response.msg_type !== 'authorize' || !response.authorize) {
                return;
            }
            
            if (response.authorize) {
                const auth = response.authorize;
                setIsLoggedIn(true);
                setAccountInfo({
                    currency   : auth.currency || '',
                    balance    : auth.balance || 0,
                    loginid    : auth.loginid || '',
                    accountType: getAccountType() || '',
                });
                setIsLoading(false);
                
                // Clear token exchange flag if it exists
                if (window.tokenExchangeInProgress) {
                    window.tokenExchangeInProgress = false;
                }
            }
        };

        // Listen for authorize responses
        BinarySocket.wait('authorize').then(handleAuthorize);

        return () => {
            // Cleanup handled by BinarySocket
        };
    }, []);

    // Helper function to format balance
    const getFormattedBalance = () => formatMoney(accountInfo.currency || 'USD', accountInfo.balance || 0, true);

    // Helper function to get account type display name
    const getAccountTypeDisplay = () => {
        if (!isLoggedIn) return '';
        const accountType = getAccountType();
        return accountType.charAt(0).toUpperCase() + accountType.slice(1);
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
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
