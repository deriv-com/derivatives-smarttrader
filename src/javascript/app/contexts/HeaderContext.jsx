import React, { createContext, useContext, useState, useEffect } from 'react';
import Client from '../base/client';
import BinarySocket from '../../_common/base/socket_base';
import { formatMoney } from '../../_common/base/currency_base';
import { getAccountType } from '../../config';

// Create the context
const HeaderContext = createContext(null);

/**
 * HeaderProvider - Manages all header-related state
 *
 * Provides:
 * - Authentication state (isLoggedIn)
 * - Account information (currency, balance, loginid, accountType)
 * - Loading states
 * - Mobile menu state
 * - Formatted balance helper
 */
const HeaderProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(Client.isLoggedIn());
    const [isLoading, setIsLoading] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [accountInfo, setAccountInfo] = useState({
        currency   : Client.get('currency') || '',
        balance    : Client.get('balance') || 0,
        loginid    : Client.get('loginid') || '',
        accountType: getAccountType() || '',
    });

    // Update login state
    useEffect(() => {
        const checkAuthState = () => {
            const loggedIn = Client.isLoggedIn();
            setIsLoggedIn(loggedIn);
            
            if (loggedIn) {
                setAccountInfo({
                    currency   : Client.get('currency') || '',
                    balance    : Client.get('balance') || 0,
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
        return Client.getAccountTitle(accountInfo.loginid);
    };

    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(prev => !prev);
    };

    // Close mobile menu
    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    const value = {
        isLoggedIn,
        isLoading,
        accountInfo,
        isMobileMenuOpen,
        getFormattedBalance,
        getAccountTypeDisplay,
        setIsLoading,
        toggleMobileMenu,
        closeMobileMenu,
    };

    return React.createElement(HeaderContext.Provider, { value }, children);
};

/**
 * useHeader - Custom hook to access header context
 *
 * @returns {Object} Header context value
 * @throws {Error} If used outside HeaderProvider
 */
const useHeader = () => {
    const context = useContext(HeaderContext);
    if (!context) {
        throw new Error('useHeader must be used within a HeaderProvider');
    }
    return context;
};

export { HeaderProvider, useHeader };
