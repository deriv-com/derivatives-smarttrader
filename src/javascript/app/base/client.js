// const { init }           = require('@livechat/customer-sdk');
const BinarySocket          = require('./socket');
const Defaults              = require('../pages/trade/defaults');
const RealityCheckData      = require('../pages/user/reality_check/reality_check.data');
const ClientBase            = require('../../_common/base/client_base');
const GTM                   = require('../../_common/base/gtm');
const SocketCache           = require('../../_common/base/socket_cache');
const { checkWhoAmI }       = require('../../_common/whoami');
const { requestRestLogout } = require('../../_common/logout');
// const { isBinaryDomain } = require('../../_common/utility');
const getElementById        = require('../../_common/common_functions').getElementById;
const removeCookies         = require('../../_common/storage').removeCookies;
const urlFor                = require('../../_common/url').urlFor;
const applyToAllElements    = require('../../_common/utility').applyToAllElements;

// const licenseID          = require('../../_common/utility').lc_licenseID;
// const clientID           = require('../../_common/utility').lc_clientID;

const Client = (() => {
    let tab_visibility_handler = null;

    /**
     * Check whoami endpoint and handle unauthorized sessions
     */
    const performWhoAmICheck = async () => {
        if (!ClientBase.isLoggedIn()) {
            return;
        }

        try {
            const result = await checkWhoAmI();
            
            if (result.error && result.error.code === 401) {
                // Session is invalid, trigger logout via sendLogoutRequest
                // eslint-disable-next-line no-console
                console.log('[WhoAmI] Session unauthorized, logging out...');
                
                // sendLogoutRequest handles REST logout and cleanup
                await sendLogoutRequest(false);
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[WhoAmI] Check failed:', error);
        }
    };

    /**
     * Sets up visibility change listener to check whoami when tab becomes visible
     */
    const setupVisibilityListener = () => {
        // Remove existing listener if any
        removeVisibilityListener();

        // Create handler function
        tab_visibility_handler = () => {
            if (document.visibilityState === 'visible') {
                // Tab became visible - check whoami
                performWhoAmICheck();
            }
        };

        // Add listener
        document.addEventListener('visibilitychange', tab_visibility_handler);
    };

    /**
     * Removes the visibility change listener
     */
    const removeVisibilityListener = () => {
        if (tab_visibility_handler) {
            document.removeEventListener('visibilitychange', tab_visibility_handler);
            tab_visibility_handler = null;
        }
    };

    const processNewAccount = (options) => {
        if (ClientBase.setNewAccount(options)) {
            setTimeout(() => { window.location.replace(options.redirect_url || defaultRedirectUrl()); }, 500); // need to redirect not using pjax
        }
    };

    // const activateByClientType = (section_id) => {
    const activateByClientType = (section_id) => {
        // const topbar_class = getElementById('topbar').classList;
        const el_section   = section_id ? getElementById(section_id) : document.body;

        // const primary_bg_color_dark = 'primary-bg-color-dark';
        // const secondary_bg_color    = 'secondary-bg-color';
        
        if (ClientBase.isLoggedIn()) {
            BinarySocket.wait('balance').then(() => {
                // const client_logged_in = getElementById('client-logged-in');
                // client_logged_in.classList.add('gr-centered');

                applyToAllElements('.client_logged_in', (el) => {
                    el.setVisibility(1);
                });

                if (ClientBase.get('is_virtual')) applyToAllElements('.client_virtual', el => el.setVisibility(1), '', el_section);

                // if (ClientBase.get('is_virtual')) {
                //     applyToAllElements('.client_virtual', (el) => { el.setVisibility(1); }, '', el_section);
                //     topbar_class.add(secondary_bg_color);
                //     topbar_class.remove(primary_bg_color_dark);
                // } else {
                //     applyToAllElements('.client_real', (el) => {
                //         el.setVisibility(1);
                //     }, '', el_section);
                //     topbar_class.add(primary_bg_color_dark);
                //     topbar_class.remove(secondary_bg_color);
                // }

                applyToAllElements('.is-login', (el) => {
                    el.style.display = 'inherit';
                });
                applyToAllElements('.is-logout', (el) => {
                    el.style.display = 'none';
                });
                
                // Only hide skeleton loaders if not on a loading trading page and header is ready
                const trading_init_progress = getElementById('trading_init_progress');
                const is_trading_loading = trading_init_progress && trading_init_progress.style.display !== 'none';
                
                // Check if header is ready via SmartTrader namespace to avoid circular dependency
                let is_header_ready = false;
                if (typeof window !== 'undefined' && window.SmartTrader?.Header?.isHeaderReady) {
                    is_header_ready = window.SmartTrader.Header.isHeaderReady();
                } else {
                    // If header readiness check not available, assume ready
                    is_header_ready = true;
                }
                
                if (!is_trading_loading && is_header_ready) {
                    // Hide skeleton loaders container for logged-in state (login buttons not needed)
                    const skeletonContainer = getElementById('skeleton-loaders-container');
                    if (skeletonContainer) {
                        skeletonContainer.style.display = 'none';
                    }
                } else if (!is_header_ready) {
                    // If header not ready, register callback via SmartTrader namespace
                    if (typeof window !== 'undefined' && window.SmartTrader?.Header?.addHeaderReadyCallback) {
                        window.SmartTrader.Header.addHeaderReadyCallback(() => {
                            // Re-run the skeleton loader logic when header is ready
                            if (!is_trading_loading) {
                                const skeletonContainer = getElementById('skeleton-loaders-container');
                                if (skeletonContainer) {
                                    skeletonContainer.style.display = 'none';
                                }
                            }
                        });
                    }
                }
            });
        } else {
            // applyToAllElements('.client_logged_in', (el) => {
            //     el.setVisibility(0);
            // }, '', el_section);
            // applyToAllElements('#client-logged-in', (el) => {
            //     el.setVisibility(0);
            // }, '', el_section);
            // getElementById('topbar-msg').setVisibility(0);
            // getElementById('menu-top').classList.remove('smaller-font', 'top-nav-menu');

            applyToAllElements('.client_logged_out', (el) => {
                el.setVisibility(1);
            }, '', el_section);
            // topbar_class.add(primary_bg_color_dark);
            // topbar_class.remove(secondary_bg_color);

            applyToAllElements('.is-login', (el) => {
                el.style.display = 'none';
            });
            // .is-logout container is already visible by default, no need to show it again
            
            // EXPLICIT CLEANUP: Always hide skeleton loaders container first for logout scenarios
            const skeletonContainer = getElementById('skeleton-loaders-container');
            if (skeletonContainer) {
                skeletonContainer.style.display = 'none';
            }
            
            // Check if header is ready via SmartTrader namespace to avoid circular dependency
            let is_header_ready = false;
            if (typeof window !== 'undefined' && window.SmartTrader?.Header?.isHeaderReady) {
                is_header_ready = window.SmartTrader.Header.isHeaderReady();
            } else {
                // If header readiness check not available, assume ready
                is_header_ready = true;
            }
            
            const logoutHeaderModule = window.SmartTrader?.Header;
            if (is_header_ready) {
                // Header is ready, coordinate with header to show login buttons
                try {
                    if (logoutHeaderModule && logoutHeaderModule.updateLoginButtonsDisplay) {
                        logoutHeaderModule.updateLoginButtonsDisplay();
                    }
                } catch (error) {
                    // Fallback: directly show login buttons if header module not available
                    applyToAllElements('#btn__login, #btn__signup', (el) => {
                        el.classList.remove('hidden');
                    });
                }
            } else if (typeof window !== 'undefined' && logoutHeaderModule && logoutHeaderModule.addHeaderReadyCallback) {
                // If header not ready, register callback via SmartTrader namespace
                logoutHeaderModule.addHeaderReadyCallback(() => {
                    // Coordinate with header when ready
                    try {
                        const callbackHeaderModule = window.SmartTrader?.Header;
                        if (callbackHeaderModule && callbackHeaderModule.updateLoginButtonsDisplay) {
                            callbackHeaderModule.updateLoginButtonsDisplay();
                        }
                    } catch (error) {
                        // Fallback: directly show login buttons
                        applyToAllElements('#btn__login, #btn__signup', (el) => {
                            el.style.display = '';
                        });
                    }
                });
            } else {
                // Final fallback: directly show login buttons
                applyToAllElements('#btn__login, #btn__signup', (el) => {
                    el.style.display = '';
                });
            }
        }
    };

    const sendLogoutRequest = async (show_login_page) => {
        if (show_login_page) {
            sessionStorage.setItem('showLoginPage', 1);
        }
        
        try {
            // Use REST logout instead of WebSocket
            const logoutResponse = await requestRestLogout();
            
            if (logoutResponse.logout === 1) {
                GTM.pushDataLayer({ event: 'log_out' });
            }
            
            // Clean up app state using doLogout
            doLogout(logoutResponse);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('[Logout Error]', error);
            // Even if REST logout fails, clean up app state
            doLogout({ logout: 1 });
        }
    };

    // Called when logging out to end ongoing chats if there is any
    // Temporarily commented out LiveChat
    // const endLiveChat = () => new Promise ((resolve) => {
    //     const session_variables = { loginid: '', landing_company_shortcode: '', currency: '', residence: '', email: '' };
    //     window.LiveChatWidget?.call('set_session_variables', session_variables);
    //     window.LiveChatWidget?.call('set_customer_email', ' ');
    //     window.LiveChatWidget?.call('set_customer_name', ' ');

    //     try {
    //         const customerSDK = init({
    //             licenseId: licenseID,
    //             clientId : clientID,
    //         });
    //         customerSDK.on('connected', () => {
    //             if (window.LiveChatWidget?.get('chat_data')) {
    //                 const { chatId, threadId } = window.LiveChatWidget.get('chat_data');
    //                 if (threadId) {
    //                     customerSDK.deactivateChat({ chatId }).catch(() => null);
    //                 }
    //             }
    //             resolve();
    //         });
    //     } catch (e){
    //         resolve();
    //     }

    // });

    const doLogout = (response) => {
        if (response.logout !== 1) return;
        
        // Remove visibility listener
        removeVisibilityListener();
        
        // Remove cookies
        removeCookies('login', 'loginid', 'loginid_list', 'email', 'residence', 'settings');
        removeCookies('reality_check', 'affiliate_token', 'affiliate_tracking', 'onfido_token', 'utm_data', 'gclid');
        
        // Clear elev.io session storage
        sessionStorage.removeItem('_elevaddon-6app');
        sessionStorage.removeItem('_elevaddon-6create');
        
        // Clear trading session
        const { MARKET, UNDERLYING } = Defaults.PARAM_NAMES;
        Defaults.remove(MARKET, UNDERLYING);
        
        // Clear client data
        ClientBase.clearAllAccounts();
        ClientBase.set('loginid', '');
        // NEW: Remove account_id and account_type instead of session_token
        localStorage.removeItem('account_id');
        localStorage.removeItem('account_type');
        
        // Clear caches
        SocketCache.clear();
        RealityCheckData.clear();
        
        // Reload the page
        window.location.reload();
    };

    const getUpgradeInfo = () => {
        const upgrade_info = ClientBase.getBasicUpgradeInfo();

        let upgrade_links = {};
        if (upgrade_info.can_upgrade_to.length) {
            const upgrade_link_map = {
                realws       : ['svg', 'iom', 'malta'],
                maltainvestws: ['maltainvest'],
            };

            Object.keys(upgrade_link_map).forEach(link => {
                const res = upgrade_link_map[link].find(lc => upgrade_info.can_upgrade_to.includes(lc));
                if (res) {
                    upgrade_links = {
                        ...upgrade_links,
                        [res]: link,
                    };
                }
            });
        }

        let transformed_upgrade_links = {};
        Object.keys(upgrade_links).forEach(link => {
            transformed_upgrade_links = {
                ...transformed_upgrade_links,
                [link]: `new_account/${upgrade_links[link]}`,
            };
        });

        return Object.assign(upgrade_info, {
            upgrade_links  : transformed_upgrade_links,
            is_current_path: !!Object.values(upgrade_links)
                .find(link => new RegExp(link, 'i').test(window.location.pathname)),
        });
    };

    const defaultRedirectUrl = () => urlFor('trading');

    return Object.assign({
        processNewAccount,
        activateByClientType,
        sendLogoutRequest,
        doLogout,
        getUpgradeInfo,
        defaultRedirectUrl,
        setupVisibilityListener,
        removeVisibilityListener,
        performWhoAmICheck,
    }, ClientBase);
})();

module.exports = Client;
