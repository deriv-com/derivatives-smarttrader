import React, { createContext, useContext, useState, useEffect } from 'react';
import Client from '../base/client';
import BinarySocket from '../../_common/base/socket_base';
import { formatMoney } from '../../_common/base/currency_base';
import { getAccountType } from '../../config';
import Language from '../../_common/language';
import { fetchDerivativesAccount } from '../../_common/derivatives_account_api';
import { BALANCE_UPDATED_EVENT } from '../pages/user/update_balance';

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
    // New state for derivatives account data
    const [derivativesAccountInfo, setDerivativesAccountInfo] = useState({
        data   : null,
        error  : null,
        loading: true,
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
                // Call the derivatives API to get the account info
                fetchDerivativesAccountData();
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

    // Listen for custom balance update events from non-React parts of the app
    useEffect(() => {
        const handleBalanceUpdateEvent = (e) => {
            const balanceData = e.detail;
            if (!balanceData) return;

            setAccountInfo((prevInfo) => ({
                ...prevInfo,
                currency   : balanceData.currency || prevInfo.currency,
                balance    : balanceData.balance || prevInfo.balance,
                loginid    : balanceData.loginid || prevInfo.loginid,
                accountType: balanceData.accountType || prevInfo.accountType,
            }));
        };

        // Add event listener for balance updates
        document.addEventListener(BALANCE_UPDATED_EVENT, handleBalanceUpdateEvent);

        // Clean up event listener on unmount
        return () => {
            document.removeEventListener(
                BALANCE_UPDATED_EVENT,
                handleBalanceUpdateEvent,
            );
        };
    }, []);

    // Helper function to format balance
    const getFormattedBalance = () =>
        formatMoney(accountInfo.currency || 'USD', accountInfo.balance || 0, true);

    // Helper function to get account type display name
    const getAccountTypeDisplay = () => {
        if (!isLoggedIn) return '';
        const accountType = getAccountType();
        return `${
            accountType.charAt(0).toUpperCase() + accountType.slice(1)
        } account`;
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
    /**
   * Fetch derivatives account data
   * @param {boolean} silent When true, suppresses loading indicators and UI error states for silent updates
   */
    const fetchDerivativesAccountData = async (silent = false) => {
        if (!silent) {
            setDerivativesAccountInfo((prev) => ({
                ...prev,
                loading: true,
                error  : null,
            }));
        }

        try {
            const response = await fetchDerivativesAccount();

            // Process account list from derivatives account data
            if (response?.data?.length > 0) {
                // Filter only active accounts
                const activeAccounts = response.data.filter(
                    (account) => account.status === 'active',
                );

                const accountList = activeAccounts.map((account) => {
                    // Convert balance string to number, removing any commas (e.g., "9,603.52" -> 9603.52)
                    const balanceNumber = parseFloat(account.balance.replace(/,/g, ''));

                    return {
                        balance   : balanceNumber,
                        currency  : account.currency || 'USD',
                        is_virtual: account.account_type === 'real' ? 0 : 1,
                        loginid   : account.account_id,
                    };
                });

                // Update state with successful data
                setDerivativesAccountInfo({
                    data   : accountList,
                    error  : null,
                    loading: false,
                });
            }

            return response;
        } catch (err) {
            if (!silent) {
                setDerivativesAccountInfo({
                    data   : null,
                    error  : err,
                    loading: false,
                });
            }

            // if the user is unauthorized, whoami will handle logout so no need to handle it here
            console.error('Error fetching derivatives account:', err);
            if (!silent) throw err;
            return null;
        } finally {
            if (!silent) {
                setDerivativesAccountInfo((prev) => ({ ...prev, loading: false }));
            }
        }
    };

    /**
   * Function to manually refetch data
   */
    const refetchDerivativesAccountSilently = async () => fetchDerivativesAccountData(true);

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
        setAccountInfo,
        // Derivatives account functionality
        derivativesAccountInfo,
        fetchDerivativesAccountData,
        refetchDerivativesAccountSilently,
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
