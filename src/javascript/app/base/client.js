const { localize }       = require('@deriv-com/translations');
// const { init }           = require('@livechat/customer-sdk');
const BinarySocket       = require('./socket');
const Defaults           = require('../pages/trade/defaults');
const RealityCheckData   = require('../pages/user/reality_check/reality_check.data');
const ClientBase         = require('../../_common/base/client_base');
const GTM                = require('../../_common/base/gtm');
const SocketCache        = require('../../_common/base/socket_cache');
// const { isBinaryDomain } = require('../../_common/utility');
const getElementById     = require('../../_common/common_functions').getElementById;
const removeCookies      = require('../../_common/storage').removeCookies;
const urlFor             = require('../../_common/url').urlFor;
const applyToAllElements = require('../../_common/utility').applyToAllElements;

// Import logout modal - store promise to avoid race condition
let logoutModalPromise;
if (typeof window !== 'undefined') {
    logoutModalPromise = import('../../../templates/_common/components/logout-modal.jsx')
        .then(module => module.default);
}

// const licenseID          = require('../../_common/utility').lc_licenseID;
// const clientID           = require('../../_common/utility').lc_clientID;

const Client = (() => {

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
            BinarySocket.wait('authorize', 'balance').then(() => {
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

    const sendLogoutRequest = (show_login_page, redirect_to) => {
        if (show_login_page) {
            sessionStorage.setItem('showLoginPage', 1);
        }
        // Remove client_information cookie
        removeCookies('client_information');
        try {
            BinarySocket.send({ logout: '1', passthrough: { redirect_to } }).then((response) => {
                if (response.logout === 1) {
                    GTM.pushDataLayer({ event: 'log_out' });
                }
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(error);
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

    const LOGOUT_MODAL_CONFIG = {
        STORAGE_KEY: 'show_logout_modal',
        get TITLE() { return localize('Log out successful'); },
        get MESSAGE() { return localize('To sign out everywhere, log out from Home and your other active platforms.'); },
        get BUTTON_TEXT() { return localize('Got it'); },
    };

    const doLogout = (response) => {
        if (response.logout !== 1) return;
        
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
        localStorage.removeItem('session_token');
        
        // Clear caches
        SocketCache.clear();
        RealityCheckData.clear();
        
        // Set flag to show logout modal after page reload
        sessionStorage.setItem(LOGOUT_MODAL_CONFIG.STORAGE_KEY, '1');
        
        // Reload the page
        window.location.reload();
    };
    
    const checkAndShowLogoutModal = async () => {
        // Check if we should show the logout modal after page reload
        const shouldShowModal = sessionStorage.getItem(LOGOUT_MODAL_CONFIG.STORAGE_KEY) === '1';
        
        if (!shouldShowModal) return;
        
        sessionStorage.removeItem(LOGOUT_MODAL_CONFIG.STORAGE_KEY);
        
        // Wait for the module to load to avoid race condition
        if (logoutModalPromise) {
            try {
                const LogoutModalModule = await logoutModalPromise;
                LogoutModalModule.init({
                    title     : LOGOUT_MODAL_CONFIG.TITLE,
                    message   : LOGOUT_MODAL_CONFIG.MESSAGE,
                    buttonText: LOGOUT_MODAL_CONFIG.BUTTON_TEXT,
                    onClose   : () => LogoutModalModule.remove(),
                });
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Failed to load logout modal:', error);
            }
        }
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
        checkAndShowLogoutModal,
        getUpgradeInfo,
        defaultRedirectUrl,
    }, ClientBase);
})();

module.exports = Client;
