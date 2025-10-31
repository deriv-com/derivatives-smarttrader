const Client = require('./client');
const BinarySocket = require('./socket');

const Login = require('../../_common/base/login');
const { getBrandHomeUrl, getPlatformHostname } = require('../../../templates/_common/brand.config');
const { getAccountType } = require('../../config');
const SocketCache = require('../../_common/base/socket_cache');
const getElementById = require('../../_common/common_functions').getElementById;
const localize = require('../../_common/localize').localize;
const Url = require('../../_common/url');
const applyToAllElements = require('../../_common/utility').applyToAllElements;
const Language = require('../../_common/language');
const createElement = require('../../_common/utility').createElement;

const getTopLevelDomain = require('../../_common/utility').getTopLevelDomain;
const getPlatformSettings =
      require('../../../templates/_common/brand.config').getPlatformSettings;

const formatMoney = require('../common/currency').formatMoney;
const isEuCountry = require('../common/country_base').isEuCountry;
const DerivLiveChat = require('../pages/livechat.jsx');
const {
    default: isHubEnabledCountry,
} = require('../common/isHubEnabledCountry.js');
const { SessionStore } = require('../../_common/storage');
const Chat = require('../../_common/chat.js').default;
const getRemoteConfig = require('../hooks/useRemoteConfig').getRemoteConfig;

const header_icon_base_path = '/images/pages/header/';

const Header = (() => {
    const notifications = [];
    let is_language_popup_on = false;
    let is_full_screen = false;
    let is_header_ready = false;

    const header_ready_callbacks = [];
    const ext_platform_url = encodeURIComponent(window.location.href);
    const fullscreen_map = {
        event: [
            'fullscreenchange',
            'webkitfullscreenchange',
            'mozfullscreenchange',
            'MSFullscreenChange',
        ],
        element: [
            'fullscreenElement',
            'webkitFullscreenElement',
            'mozFullScreenElement',
            'msFullscreenElement',
        ],
        fnc_enter: [
            'requestFullscreen',
            'webkitRequestFullscreen',
            'mozRequestFullScreen',
            'msRequestFullscreen',
        ],
        fnc_exit: [
            'exitFullscreen',
            'webkitExitFullscreen',
            'mozCancelFullScreen',
            'msExitFullscreen',
        ],
    };

    const addHeaderReadyCallback = (callback) => {
        if (is_header_ready) {
            callback();
        } else {
            header_ready_callbacks.push(callback);
        }
    };

    const triggerHeaderReadyCallbacks = () => {
        is_header_ready = true;
        header_ready_callbacks.forEach((callback) => {
            try {
                callback();
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Header ready callback error:', error);
            }
        });
        header_ready_callbacks.length = 0; // Clear callbacks array
    };

    const isHeaderReady = () => is_header_ready;

    // Expose functions via SmartTrader namespace to avoid circular dependencies
    if (typeof window !== 'undefined') {
        // Initialize SmartTrader namespace
        window.SmartTrader = window.SmartTrader || {};
        window.SmartTrader.Header = {
            addHeaderReadyCallback,
            isHeaderReady,
            updateLoginButtonsDisplay: () => updateLoginButtonsDisplay(),
        };
    }

    // Define topbar detection function before onLoad
    const waitForTopbarElements = () => {
        const targetSelectors = ['topbar-help-centre', 'topbar-whatsapp', 'topbar-fullscreen'];
        const attachedListeners = new Set();
        
        const checkAndBindElements = () => {
            targetSelectors.forEach(selector => {
                if (!attachedListeners.has(selector)) {
                    const element = getElementById(selector);
                    if (element) {
                        switch (selector) {
                            case 'topbar-help-centre':
                                element.addEventListener('click', () => {
                                    window.location = `https://www.deriv.${getTopLevelDomain()}/help-centre/`;
                                });
                                break;
                            case 'topbar-whatsapp':
                                element.addEventListener('click', () => {
                                    window.open('https://wa.me/35699578341', '_blank');
                                });
                                break;
                            case 'topbar-fullscreen':
                                element.addEventListener('click', () => {
                                    toggleFullscreen();
                                });
                                break;
                            default:
                                break;
                        }
                        attachedListeners.add(selector);
                    }
                }
            });
            
            // If all elements are found, stop observing
            if (attachedListeners.size === targetSelectors.length) {
                if (observer) observer.disconnect();
                return true;
            }
            return false;
        };
        
        // Try immediately first
        if (checkAndBindElements()) return;
        
        // Set up MutationObserver to watch for DOM changes
        const observer = new MutationObserver(() => {
            checkAndBindElements();
        });
        
        // Start observing the document body for child additions
        observer.observe(document.body, {
            childList: true,
            subtree  : true,
        });
        
        // Also set up a fallback timeout check every 100ms for 5 seconds
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds
        const intervalCheck = setInterval(() => {
            attempts++;
            if (checkAndBindElements() || attempts >= maxAttempts) {
                clearInterval(intervalCheck);
            }
        }, 100);
    };

    // Modern account info setup for single-account mode (matching bot project)
    const setupSingleAccountHeader = () => {
        if (!Client.isLoggedIn()) return;
        
        BinarySocket.wait('authorize', 'balance').then(() => {
            const currency = Client.get('currency');
            const loginid = Client.get('loginid');
            const balance = Client.get('balance') || 0;
            const accountType = getAccountType();
            
            if (currency && loginid) {
                // Set account icon
                const getIcon = () => {
                    if (accountType === 'real') return currency ? currency.toLowerCase() : 'unknown';
                    return 'virtual';
                };
                
                const icon = Url.urlForStatic(
                    `${header_icon_base_path}ic-currency-${getIcon()}.svg?${process.env.BUILD_HASH}`
                );
                
                // Set account icon
                const iconElement = getElementById('header__acc-icon');
                if (iconElement) {
                    iconElement.src = icon;
                }
                
                // Set account type (Real/Demo)
                const accountTypeElement = getElementById('header__acc-type');
                if (accountTypeElement) {
                    accountTypeElement.textContent = accountType === 'demo' ? 'Demo' : 'Real';
                }
                
                // Set balance if not already set by updateBalance
                const balanceElement = getElementById('header__acc-balance');
                if (balanceElement && (!balanceElement.innerHTML || balanceElement.innerHTML.trim() === '')) {
                    const display_balance = formatMoney(currency, balance);
                    balanceElement.innerHTML = display_balance;
                }
            }
        });
    };

    const onLoad = async () => {
        try {
            bindSvg();
            updateLoginButtonsDisplay();
            
            // Set navigation URLs immediately - don't wait for WebSocket
            setHeaderUrls();
            
            // Call topbar detection immediately - don't wait for WebSocket
            waitForTopbarElements();
            bindClick();
            
            // Set up header account info for single-account mode immediately
            setupSingleAccountHeader();
            
            await BinarySocket.wait('authorize');

        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Header.onLoad() error:', error);
        }
    
        fullscreen_map.event.forEach((event) => {
            document.addEventListener(event, onFullScreen, false);
        });
        
        applyFeatureFlags();
        
        // Mark header as ready and trigger any waiting callbacks
        triggerHeaderReadyCallbacks();
    };

    const applyFeatureFlags = () => {
        getRemoteConfig(true)
            .then((data) => {
                const { cs_chat_livechat, cs_chat_whatsapp } = data.data;

                const topbar_whatsapp = getElementById('topbar-whatsapp');
                const whatsapp_mobile_drawer = getElementById('whatsapp-mobile-drawer');

                if (document.getElementById('deriv_livechat')) {
                    DerivLiveChat.init(cs_chat_livechat);
                }

                topbar_whatsapp.style.display = cs_chat_whatsapp
                    ? 'inline-flex'
                    : 'none';
                whatsapp_mobile_drawer.style.display = cs_chat_whatsapp
                    ? 'flex'
                    : 'none';
            })

            .catch((error) => {
                if (document.getElementById('deriv_livechat')) {
                    DerivLiveChat.init();
                }
                // eslint-disable-next-line no-console
                console.error('Error fetching feature flags:', error);
            });
    };

    const setHeaderUrls = () => {
        const url_add_account_dynamic = document.getElementById(
            'url-add-account-dynamic'
        );

        if (isEuCountry()) {
            url_add_account_dynamic.classList.remove('url-add-account');
            url_add_account_dynamic.classList.add('url-add-account-multiplier');
        }

        applyToAllElements('.url-wallet-apps', (el) => {
            el.href = isHubEnabledCountry()
                ? Url.urlForTradersHub(
                    'tradershub/redirect',
                    `action=redirect_to&redirect_to=cfds&account=${
                        Url.param('account') || SessionStore.get('account').toUpperCase()
                    }`
                )
                : Url.urlForDeriv('', `ext_platform_url=${ext_platform_url}`);
        });
        applyToAllElements('.url-appstore', (el) => {
            el.href = isHubEnabledCountry()
                ? Url.urlForTradersHub(
                    'tradershub/redirect',
                    `action=redirect_to&redirect_to=home&account=${
                        Url.param('account') || SessionStore.get('account').toUpperCase()
                    }`
                )
                : Url.urlForDeriv('', `ext_platform_url=${ext_platform_url}`);
        });
        applyToAllElements('.url-appstore-cfd', (el) => {
            el.href = isHubEnabledCountry()
                ? Url.urlForTradersHub(
                    'tradershub/redirect',
                    `action=redirect_to&redirect_to=cfds&account=${
                        Url.param('account') || SessionStore.get('account').toUpperCase()
                    }`
                )
                : Url.urlForDeriv('', `ext_platform_url=${ext_platform_url}`);
        });
        applyToAllElements('.url-reports-positions', (el) => {
            const account_type = getAccountType();
            const redirect_url = getPlatformHostname();
            
            el.href = Url.urlForReports(
                'reports/positions',
                redirect_url,
                account_type
            );
        });
        applyToAllElements('.url-reports-profit', (el) => {
            el.href = Url.urlForDeriv(
                'reports/profit',
                `ext_platform_url=${ext_platform_url}`
            );
        });
        applyToAllElements('.url-reports-statement', (el) => {
            el.href = Url.urlForDeriv(
                'reports/statement',
                `ext_platform_url=${ext_platform_url}`
            );
        });

        applyToAllElements('.url-add-account', (el) => {
            el.href = Url.urlForDeriv(
                'redirect',
                `action=add_account&ext_platform_url=${ext_platform_url}`
            );
        });
        applyToAllElements('.url-add-account-multiplier', (el) => {
            el.href = Url.urlForDeriv(
                'redirect',
                `action=add_account_multiplier&ext_platform_url=${ext_platform_url}`
            );
        });
        applyToAllElements('.url-manage-account', (el) => {
            el.href = isHubEnabledCountry()
                ? Url.urlForTradersHub(
                    'tradershub/redirect',
                    `action=redirect_to&redirect_to=wallet&account=${
                        Url.param('account') || SessionStore.get('account').toUpperCase()
                    }`
                )
                : Url.urlForDeriv(
                    'redirect',
                    `action=manage_account&ext_platform_url=${ext_platform_url}`
                );
        });
        applyToAllElements('.url-wallets-deposit', (el) => {
            el.href = isHubEnabledCountry()
                ? Url.urlForTradersHub(
                    'tradershub/redirect',
                    `action=redirect_to&redirect_to=wallet&account=${
                        Url.param('account') || SessionStore.get('account').toUpperCase()
                    }`
                )
                : Url.urlForDeriv(
                    'redirect',
                    `action=payment_transfer&ext_platform_url=${ext_platform_url}`
                );
        });

        // Set Deriv logo links to brand home URL
        applyToAllElements('.url-deriv-com', (el) => {
            el.href = getBrandHomeUrl();
        });
        applyToAllElements('.url-deriv-com-mobile', (el) => {
            el.href = getBrandHomeUrl();
        });
    };

    const onUnload = () => {
        fullscreen_map.event.forEach((event) => {
            document.removeEventListener(event, onFullScreen);
        });
    };

    const onFullScreen = () => {
        is_full_screen = fullscreen_map.element.some((el) => document[el]);
    };

    const bindSvg = () => {
        applyToAllElements('#add-account-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-add-account.svg?${process.env.BUILD_HASH}`
            );
        });
        
        applyToAllElements('#appstore-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-appstore-home.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.header__expand', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-chevron-down.svg?${process.env.BUILD_HASH}`
            );
        });
        // TODO : Change to light arrow down icon
        applyToAllElements('.header__expand-light', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-chevron-down.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.header__logo', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}${getPlatformSettings('smarttrader').icon}?${
                    process.env.BUILD_HASH
                }`
            );
        });

        applyToAllElements('.logout-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-logout.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.reports-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-reports.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.whatsapp-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-whatsapp.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.livechat-icon', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-livechat.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.btn__close', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-close.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#header__hamburger', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-hamburger.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.deriv-com-logo', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}deriv-com-logo.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('.deriv-com-logo-mobile', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}deriv-com-logo.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#mobile__platform-switcher-icon-trade', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-trade.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#mobile__platform-switcher-icon-arrowright', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-chevron-right.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#mobile__menu-content-submenu-icon-back', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-chevron-left.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements(
            '#mobile__menu-content-submenu-account-settings-icon-back',
            (el) => {
                el.src = Url.urlForStatic(
                    `${header_icon_base_path}ic-chevron-left.svg?${process.env.BUILD_HASH}`
                );
            }
        );

        applyToAllElements(
            '#mobile__menu-content-submenu-language-icon-back',
            (el) => {
                el.src = Url.urlForStatic(
                    `${header_icon_base_path}ic-chevron-left.svg?${process.env.BUILD_HASH}`
                );
            }
        );

        applyToAllElements('#mobile__menu-content-submenu-icon-open', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-portfolio.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#mobile__menu-content-submenu-icon-profit', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-profit-table.svg?${process.env.BUILD_HASH}`
            );
        });

        applyToAllElements('#mobile__menu-content-submenu-icon-statement', (el) => {
            el.src = Url.urlForStatic(
                `${header_icon_base_path}ic-statement.svg?${process.env.BUILD_HASH}`
            );
        });
    };

    const updateLoginButtonsDisplay = () => {
        // Get login and signup buttons
        const btn_login = getElementById('btn__login');
        const btn_signup = getElementById('btn__signup');
        
        if (!btn_login || !btn_signup) return;

        // Hide buttons initially
        btn_login.style.display = 'none';
        btn_signup.style.display = 'none';
        
        // Check if user is logged out
        const is_logged_out = !Client.isLoggedIn();
        
        // Check if there's a token in URL and user is not logged in - if so, show skeleton loaders
        const urlParams = new URLSearchParams(window.location.search);
        const hasToken = urlParams.get('token');
        
        if (hasToken && is_logged_out) {
            showHeaderSkeletonLoaders();
            return;
        }
        
        // Check if we're on a trading page and if trading is still loading
        const is_trading_page = window.location.pathname.includes('/trading');
        const trading_init_progress = getElementById('trading_init_progress');
        const is_trading_loading = trading_init_progress && trading_init_progress.style.display !== 'none';
        
        // If user is logged out, always show login buttons
        if (is_logged_out) {
            removeHeaderSkeletonLoaders();
            btn_login.style.display = 'flex';
            btn_signup.style.display = 'flex';
            return;
        }
        
        // On trading pages, sync with purchase container loading state (only for logged-in users)
        if (is_trading_page && is_trading_loading) {
            showHeaderSkeletonLoaders();
            return;
        }
        
        // For logged-in users, hide login buttons and skeleton loaders
        removeHeaderSkeletonLoaders();
    };

    const showHeaderSkeletonLoaders = () => {
        const btn_login = getElementById('btn__login');
        const btn_signup = getElementById('btn__signup');
        const skeleton_container = getElementById('skeleton-loaders-container');
        
        if (!skeleton_container) return;
        
        // Hide actual buttons
        if (btn_login) btn_login.style.display = 'none';
        if (btn_signup) btn_signup.style.display = 'none';
        
        // Show React skeleton loaders container
        skeleton_container.style.display = 'flex';
    };

    const removeHeaderSkeletonLoaders = () => {
        const skeleton_container = getElementById('skeleton-loaders-container');
        
        // Hide React skeleton loaders container
        if (skeleton_container) {
            skeleton_container.style.display = 'none';
        }
        
        // Also remove any legacy DOM skeleton loaders that might exist
        const skeleton_login = document.querySelector('.skeleton-btn-login:not(.skeleton-loaders-container .skeleton-btn-login)');
        const skeleton_signup = document.querySelector('.skeleton-btn-signup:not(.skeleton-loaders-container .skeleton-btn-signup)');
        
        if (skeleton_login) skeleton_login.remove();
        if (skeleton_signup) skeleton_signup.remove();
    };

    const bindClick = () => {
        updateLoginButtonsDisplay();
        const btn_login = getElementById('btn__login');
        const btn_signup = getElementById('btn__signup');
        
        if (btn_login) {
            btn_login.onclick = Login.redirectToLogin;
        }
        
        if (btn_signup) {
            btn_signup.onclick = Login.redirectToSignup;
        }

        applyToAllElements('.logout', (el) => {
            el.addEventListener('click', logoutOnClick);
        });
        // Mobile menu
        const mobile_menu_overlay = getElementById('mobile__container');
        const mobile_menu = getElementById('mobile__menu');
        const mobile_menu_close = getElementById('mobile__menu-close');
        const hamburger_menu = getElementById('header__hamburger');
        const mobile_menu_livechat = getElementById('mobile__menu-livechat');
        const mobile_menu__livechat_logo = getElementById(
            'mobile__menu-header-livechat__logo'
        );
        const mobile_menu_active = 'mobile__container--active';
        const showMobileMenu = (shouldShow) => {
            if (shouldShow) {
                mobile_menu_overlay.classList.add(mobile_menu_active);
                document.body.classList.add('stop-scrolling');
            } else {
                // Reset all submenu states before closing the sidebar
                resetAllSubmenus();
                mobile_menu_overlay.classList.remove(mobile_menu_active);
                document.body.classList.remove('stop-scrolling');
            }
        };

        if (hamburger_menu) {
            hamburger_menu.addEventListener('click', () => showMobileMenu(true));
        }
        if (mobile_menu_close) {
            mobile_menu_close.addEventListener('click', () => showMobileMenu(false));
        }
        if (mobile_menu_livechat) {
            mobile_menu_livechat.addEventListener('click', async () => {
                await Chat.open();
            });
        }

        // Mobile Menu Livechat Icon
        mobile_menu__livechat_logo.src = Url.urlForStatic(
            `images/common/livechat.svg?${process.env.BUILD_HASH}`
        );

        // Dynamic link for trader's hub cta for mobile menu
        const mobile_platform_appstore_link = getElementById('url-appstore');
        // Get current account parameter from URL
        const url_params = new URLSearchParams(window.location.search);
        const account_param = url_params.get('account');
        const traders_hub_link = isHubEnabledCountry()
            ? Url.urlForTradersHub(
                'tradershub/redirect',
                `action=redirect_to&redirect_to=home&account=${
                    Url.param('account') || SessionStore.get('account').toUpperCase()
                }`
            )
            : Url.urlForDeriv(
                '',
                `ext_platform_url=${ext_platform_url}${
                    account_param ? `&account=${account_param}` : ''
                }`
            );
        mobile_platform_appstore_link.href = traders_hub_link;

        // Note: wallet switcher functionality is disabled for single account mode

        // Mobile reports menu
        const appstore_menu = getElementById(
            'mobile__platform-switcher-item-appstore'
        );
        const report_menu = getElementById(
            'mobile__platform-switcher-item-reports'
        );
        const cashier_menu = getElementById(
            'mobile__platform-switcher-item-cashier'
        );
        const account_settings_menu = getElementById(
            'mobile__platform-switcher-item-account-settings'
        );
        const language_menu = getElementById(
            'mobile__platform-switcher-item-language'
        );
        const menu = getElementById('mobile_menu-content');
        const submenu = getElementById('mobile__menu-content-submenu');
        const cashier_submenu = getElementById(
            'mobile__menu-content-submenu-cashier'
        );
        const account_settings_submenu = getElementById(
            'mobile__menu-content-submenu-account-settings'
        );
        const language_submenu = getElementById(
            'mobile__menu-content-submenu-language'
        );
        const back = getElementById('mobile__menu-content-submenu-header');
        const cashier_back = getElementById(
            'mobile__menu-content-submenu-cashier-header'
        );
        const account_settings_back = getElementById(
            'mobile__menu-content-submenu-account-settings-header'
        );
        const language_back = getElementById(
            'mobile__menu-content-submenu-language-header'
        );
        const header_language_selector = getElementById(
            'mobile__menu-language-selector'
        );
        const submenu_active = 'mobile__menu-content-submenu--active';
        const account_settings_header = getElementById(
            'mobile__menu-content-submenu-account-settings-header'
        );
        const profile_category_headers = document.querySelectorAll(
            '#mobile__menu-content-submenu-account-settings .mobile__menu-content-submenu-category-header'
        );
        const menu_active = 'mobile__menu-content--active';
        const showMobileSubmenu = (shouldShow) => {
            if (shouldShow) {
                submenu.classList.add(submenu_active);
                menu.classList.remove(menu_active);
            } else {
                submenu.classList.remove(submenu_active);
                menu.classList.add(menu_active);
            }
        };

        const showMobileCashierSubmenu = (shouldShow) => {
            if (shouldShow) {
                cashier_submenu.classList.add(submenu_active);
                menu.classList.remove(menu_active);
            } else {
                cashier_submenu.classList.remove(submenu_active);
                menu.classList.add(menu_active);
            }
        };

        const showMobileAccountSettingsSubmenu = (shouldShow) => {
            if (shouldShow) {
                account_settings_submenu.classList.add(submenu_active);
                menu.classList.remove(menu_active);
            } else {
                account_settings_submenu.classList.remove(submenu_active);
                menu.classList.add(menu_active);
            }
        };

        const resetAllSubmenus = () => {
            // Reset all submenu states to show main menu when sidebar is closed
            try {
                // Hide all submenus by removing active classes
                submenu.classList.remove(submenu_active);
                cashier_submenu.classList.remove(submenu_active);
                account_settings_submenu.classList.remove(submenu_active);
                language_submenu.classList.remove(submenu_active);
                
                // Show main menu by adding active class
                menu.classList.add(menu_active);
                
                // Reset language submenu context
                languageSubmenuContext = null;
                
                // Show the language selector if it was hidden
                const languageSelector = getElementById(
                    'mobile__menu-language-selector'
                );
                if (languageSelector) {
                    languageSelector.classList.remove(
                        'mobile__menu-language-selector--hidden'
                    );
                }
                
                // Restore account settings headers if they were hidden
                restoreAccountSettingsHeaders();
            } catch (error) {
                // Silently handle any errors to prevent breaking the sidebar functionality
                // eslint-disable-next-line no-console
                console.warn('Error resetting mobile submenus:', error);
            }
        };

        let languageSubmenuContext = null;
        const LANGUAGE_CONTEXT = {
            HEADER          : 'header',
            MAIN_MENU       : 'main_menu',
            ACCOUNT_SETTINGS: 'account_settings',
        };

        const hideAccountSettingsHeaders = () => {
            try {
                if (account_settings_header) {
                    account_settings_header.style.display = 'none';
                }
                if (profile_category_headers && profile_category_headers.length > 0) {
                    profile_category_headers.forEach((header) => {
                        if (header) header.style.display = 'none';
                    });
                }
            } catch (error) {
                // Error handling - silently continue
            }
        };

        const restoreAccountSettingsHeaders = () => {
            try {
                if (account_settings_header) {
                    account_settings_header.style.display = '';
                }
                if (profile_category_headers && profile_category_headers.length > 0) {
                    profile_category_headers.forEach((header) => {
                        if (header) header.style.display = '';
                    });
                }
            } catch (error) {
                // Error handling - silently continue
            }
        };

        const showMobileLanguageSubmenu = (shouldShow, context = null) => {
            const languageSelector = getElementById('mobile__menu-language-selector');
            
            if (shouldShow) {
                languageSubmenuContext = context;
                
                // Hide the language selector when submenu opens
                if (languageSelector) {
                    languageSelector.classList.add(
                        'mobile__menu-language-selector--hidden'
                    );
                }
                
                language_submenu.classList.add(submenu_active);
                menu.classList.remove(menu_active);
                
                if (context === LANGUAGE_CONTEXT.ACCOUNT_SETTINGS) {
                    account_settings_submenu.classList.remove(submenu_active);
                    
                    hideAccountSettingsHeaders();
                }
            } else {
                // Show the language selector when submenu closes
                if (languageSelector) {
                    languageSelector.classList.remove(
                        'mobile__menu-language-selector--hidden'
                    );
                }
                
                language_submenu.classList.remove(submenu_active);
                
                if (languageSubmenuContext === LANGUAGE_CONTEXT.ACCOUNT_SETTINGS) {
                    account_settings_submenu.classList.add(submenu_active);
                    
                    restoreAccountSettingsHeaders();
                } else {
                    menu.classList.add(menu_active);
                }
                
                languageSubmenuContext = null;
            }
        };

        // Some note here
        appstore_menu.addEventListener('click', () => {
            showMobileSubmenu(false);
        });

        report_menu.addEventListener('click', () => {
            showMobileSubmenu(true);
        });

        back.addEventListener('click', () => {
            showMobileSubmenu(false);
        });

        cashier_menu.addEventListener('click', () => {
            showMobileCashierSubmenu(true);
        });

        cashier_back.addEventListener('click', () => {
            showMobileCashierSubmenu(false);
        });

        account_settings_menu.addEventListener('click', () => {
            showMobileAccountSettingsSubmenu(true);
        });

        account_settings_back.addEventListener('click', () => {
            showMobileAccountSettingsSubmenu(false);
        });

        header_language_selector.addEventListener('click', () => {
            showMobileLanguageSubmenu(true, LANGUAGE_CONTEXT.HEADER);
        });

        language_menu.addEventListener('click', () => {
            showMobileLanguageSubmenu(true, LANGUAGE_CONTEXT.MAIN_MENU);
        });

        const account_settings_languages = getElementById(
            'mobile__account-settings-languages'
        );
        if (account_settings_languages) {
            account_settings_languages.addEventListener('click', () => {
                showMobileLanguageSubmenu(true, LANGUAGE_CONTEXT.ACCOUNT_SETTINGS);
            });
        }

        language_back.addEventListener('click', () => {
            showMobileLanguageSubmenu(false);
        });

        applyToAllElements(
            '.mobile__language-item',
            (el) => {
                el.addEventListener('click', () => {
                    const selectedLanguage = el.getAttribute('data-language');
                    const currentLanguage = Language.get();
                
                    if (selectedLanguage === currentLanguage) return;

                    const allLanguages = Object.keys(Language.getAll());
                    if (!allLanguages.includes(selectedLanguage.toUpperCase())) {
                    // eslint-disable-next-line no-console
                        console.warn('Invalid language selected:', selectedLanguage);
                        return;
                    }
                
                    SocketCache.clear();
                
                    // Safely redirect using window.location.href to prevent XSS
                    const sanitizedLanguage = encodeURIComponent(
                        selectedLanguage.trim().toLowerCase()
                    );
                    window.location.href = Language.urlFor(sanitizedLanguage);
                });
            },
            '',
            getElementById('mobile__menu-content-submenu-language')
        );

        const updateMobileLanguageDisplay = () => {
            const currentLanguage = Language.get();
            
            const flagImg = getElementById('mobile__menu-language-flag');
            const langText = getElementById('mobile__menu-language-text');
            
            if (flagImg && langText) {
                flagImg.src = Url.urlForStatic(
                    `images/languages/ic-flag-${currentLanguage.toLowerCase()}.svg?${
                        process.env.BUILD_HASH
                    }`
                );
                langText.textContent = currentLanguage.toUpperCase();
            }
            
            applyToAllElements('.mobile__language-item', (el) => {
                const itemLang = el.getAttribute('data-language');
                if (itemLang === currentLanguage.toUpperCase()) {
                    el.classList.add('mobile__language-item--active');
                } else {
                    el.classList.remove('mobile__language-item--active');
                }
            });
        };

        updateMobileLanguageDisplay();

        // OnClickOutisde Event Handle
        document.addEventListener('click', (event) => {
            // Mobile Menu
            if (
                !mobile_menu.contains(event.target) &&
        !hamburger_menu.contains(event.target) &&
        mobile_menu_overlay.classList.contains(mobile_menu_active)
            ) {
                showMobileMenu(false);
            }
        });

        // whatsapp mobile menu
        const whatsapp_mobile_drawer = getElementById('whatsapp-mobile-drawer');
        whatsapp_mobile_drawer.addEventListener('click', () =>
            window.open('https://wa.me/35699578341', '_blank')
        );

        // Livechat Logo
        const livechat_img = getElementById('livechat__logo');
        livechat_img.src = Url.urlForStatic(
            `images/common/livechat.svg?${process.env.BUILD_HASH}`
        );

        // Livechat Launcher
        const livechat = getElementById('livechat');
        livechat.addEventListener('click', async () => {
            await Chat.open();
        });

        // Language Popup.
        const current_language = Language.get();
        const available_languages = Object.entries(Language.getAll()).filter(
            (language) => !/ACH/.test(language[0])
        );

        const el_language_select_img = getElementById('language-select__logo');
        el_language_select_img.src = Url.urlForStatic(
            `images/languages/ic-flag-${current_language.toLowerCase()}.svg?${
                process.env.BUILD_HASH
            }`
        );

        getElementById('language-select').addEventListener(
            'click',
            toggleLanguagePopup
        );

        const el_language_menu_modal = getElementById('language-menu-modal');
        el_language_menu_modal.addEventListener('click', (e) => {
            if ($(e.target).is(el_language_menu_modal)) {
                toggleLanguagePopup();
            }
        });

        available_languages.map((language) => {
            const language_menu_item = createElement('div', {
                class: `language-menu-item${
                    current_language === language[0] ? ' language-menu-item__active' : ''
                }`,
                id: language[0],
            });
            language_menu_item.appendChild(
                createElement('img', {
                    src: Url.urlForStatic(
                        `images/languages/ic-flag-${language[0].toLowerCase()}.svg?${
                            process.env.BUILD_HASH
                        }`
                    ),
                })
            );
            language_menu_item.appendChild(
                createElement('span', { text: language[1] })
            );
            getElementById('language-menu-list').appendChild(language_menu_item);
        });

        applyToAllElements(
            '.language-menu-item',
            (el) => {
                el.addEventListener('click', () => {
                    const item_language = el.getAttribute('id');
                    if (item_language === current_language) return;
                
                    // Validate language before redirecting to prevent XSS
                    const allLanguages = Object.keys(Language.getAll());
                    if (!allLanguages.includes(item_language.toUpperCase())) {
                    // eslint-disable-next-line no-console
                        console.warn('Invalid language selected:', item_language);
                        return;
                    }
                
                    SocketCache.clear();

                    // Safely redirect using window.location.href to prevent XSS
                    window.location.href = Language.urlFor(item_language);
                });
            },
            '',
            getElementById('language-menu-list')
        );

        const el_language_menu_close_btn = getElementById(
            'language-menu-close_btn'
        );
        el_language_menu_close_btn.addEventListener('click', toggleLanguagePopup);

    };

    const toggleLanguagePopup = () => {
        is_language_popup_on = !is_language_popup_on;
        getElementById('language-menu-modal').setVisibility(is_language_popup_on);
    };

    const toggleFullscreen = () => {
        const to_exit = is_full_screen;
        const el = to_exit ? document : document.documentElement;
        const fncToCall = fullscreen_map[to_exit ? 'fnc_exit' : 'fnc_enter'].find(
            (fnc) => el[fnc]
        );

        if (fncToCall) {
            el[fncToCall]();
        }
    };

    const logoutOnClick = () => {
        Client.sendLogoutRequest();
    };

    const upgradeMessageVisibility = () => {
        BinarySocket.wait(
            'authorize',
        ).then(() => {
            const upgrade_msg = document.getElementsByClassName('upgrademessage');

            if (!upgrade_msg) {
                return;
            }

            const showUpgrade = (url, localized_text) => {
                applyToAllElements(upgrade_msg, (el) => {
                    el.setVisibility(1);
                    applyToAllElements(
                        'a',
                        (ele) => {
                            ele
                                .html(createElement('span', { text: localized_text }))
                                .setVisibility(1)
                                .setAttribute('href', Url.urlFor(url));
                        },
                        '',
                        el
                    );
                });
            };

            const showUpgradeBtn = (url, localized_text) => {
                applyToAllElements(upgrade_msg, (el) => {
                    el.setVisibility(1);
                    applyToAllElements(
                        'a.button',
                        (ele) => {
                            ele
                                .html(createElement('span', { text: localized_text }))
                                .setVisibility(1)
                                .setAttribute('href', Url.urlFor(url));
                        },
                        '',
                        el
                    );
                });
            };

            const upgrade_info = Client.getUpgradeInfo();
            const show_upgrade_msg = upgrade_info.can_upgrade;
            let upgrade_link_txt = '';
            let upgrade_btn_txt = '';

            if (upgrade_info.can_upgrade_to.length > 1) {
                upgrade_link_txt = localize('Click here to open a Real Account');
                upgrade_btn_txt = localize('Open a Real Account');
            } else if (upgrade_info.can_upgrade_to.length === 1) {
                upgrade_link_txt = () => {
                    if (upgrade_info.type[0] === 'financial') {
                        return localize('Click here to open a Financial Account');
                    }
                    return upgrade_info.can_upgrade_to[0] === 'malta'
                        ? localize('Click here to open a Gaming account')
                        : localize('Click here to open a Real Account');
                };
                upgrade_btn_txt =
          upgrade_info.type[0] === 'financial'
              ? localize('Open a Financial Account')
              : localize('Open a Real Account');
            }

            if (getAccountType() === 'demo') {
                applyToAllElements(upgrade_msg, (el) => {
                    el.setVisibility(1);
                    const span = el.getElementsByTagName('span')[0];
                    if (span) {
                        span.setVisibility(1);
                    }
                    applyToAllElements(
                        'a',
                        (ele) => {
                            ele.setVisibility(0);
                        },
                        '',
                        el
                    );
                });

                if (show_upgrade_msg) {
                    const upgrade_url =
            upgrade_info.can_upgrade_to.length > 1
                ? 'user/accounts'
                : Object.values(upgrade_info.upgrade_links)[0];
                    showUpgrade(upgrade_url, upgrade_link_txt);
                    showUpgradeBtn(upgrade_url, upgrade_btn_txt);
                } else {
                    applyToAllElements(upgrade_msg, (el) => {
                        applyToAllElements(
                            'a',
                            (ele) => {
                                ele.setVisibility(0).innerHTML = '';
                            },
                            '',
                            el
                        );
                    });
                }
            } else if (show_upgrade_msg) {
                getElementById('virtual-wrapper').setVisibility(0);
                const upgrade_url =
          upgrade_info.can_upgrade_to.length > 1
              ? 'user/accounts'
              : Object.values(upgrade_info.upgrade_links)[0];
                showUpgrade(upgrade_url, upgrade_link_txt);
                showUpgradeBtn(upgrade_url, upgrade_btn_txt);

            } else {
                applyToAllElements(upgrade_msg, (el) => {
                    el.setVisibility(0);
                });
            }

        });
    };

    const displayNotification = ({
        key,
        type,
        title,
        message,
        button_text,
        button_link,
    }) => {

        if (notifications.some((notification) => notification === key)) return;

        const notification_content = getElementById('header__notification-content');
        const notification_item = createElement('div', {
            class             : 'header__notification-content-item',
            'notification-key': key,
        });
        const notification_icon = createElement('img', {
            src: Url.urlForStatic(
                `${header_icon_base_path}ic-alert-${type || 'info'}.svg?${
                    process.env.BUILD_HASH
                }`
            ),
        });
        const notification_message = createElement('div', {
            class: 'header__notification-content-message',
        });
        const notification_title = createElement('div', {
            text : title,
            class: 'header__notification-content-title',
        });
        const notification_text = createElement('div', {
            html : message,
            class: 'header__notification-content-desc',
        });

        notification_message.appendChild(notification_title);
        notification_message.appendChild(notification_text);
        notification_item.appendChild(notification_icon);
        if (button_text && button_link) {
            const notification_button = createElement('a', {
                text : button_text,
                class: 'btn btn--secondary header__notification-btn',
                href : button_link,
            });
            notification_message.appendChild(notification_button);
        }
        notification_item.appendChild(notification_message);
        notification_content.appendChild(notification_item);
        notifications.push(key);
        updateNotificationCount();
    };

    const hideNotification = (key) => {

        if (!notifications.some((notification) => notification === key)) return;

        notifications.splice(notifications.indexOf(key), 1);

        const removed_item = document.querySelector(
            `div[notification-key="${key}"]`
        );
        applyToAllElements('#header__notification-content', (el) => {
            el.removeChild(removed_item);
        });
        updateNotificationCount();
    };

    const updateNotificationCount = () => {
        applyToAllElements('#header__notification-count', (el) => {
            const notification_length = notifications.length;
            el.html(notification_length);
            if (notifications.length) {
                el.style.display = 'flex';
                el.html(notifications.length);
            } else {
                el.style.display = 'none';
            }
        });

        applyToAllElements('#header__notification-empty', (el) => {
            if (notifications.length) {
                el.style.display = 'none';
            } else {
                el.style.display = 'block';
            }
        });
    };

    return {
        onLoad,
        onUnload,
        upgradeMessageVisibility,
        displayNotification,
        hideNotification,
        updateLoginButtonsDisplay,
        addHeaderReadyCallback,
        isHeaderReady,
    };
})();

module.exports = Header;
