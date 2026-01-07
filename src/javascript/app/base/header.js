const { localize } = require('@deriv-com/translations');
const Client = require('./client');
const BinarySocket = require('./socket');
const Login = require('../../_common/base/login');
const { getAccountType } = require('../../config');
const getElementById = require('../../_common/common_functions').getElementById;
const Url = require('../../_common/url');
const applyToAllElements = require('../../_common/utility').applyToAllElements;
const Language = require('../../_common/language');
const createElement = require('../../_common/utility').createElement;
const getTopLevelDomain = require('../../_common/utility').getTopLevelDomain;
const DerivLiveChat = require('../pages/livechat.jsx');
const Chat = require('../../_common/chat.js').default;
const getRemoteConfig = require('../hooks/useRemoteConfig').getRemoteConfig;
const { init: initHeaderComponent } = require('../components/header.jsx');

const header_icon_base_path = '/images/pages/header/';

const Header = (() => {
    const notifications = [];
    let is_full_screen = false;
    let is_header_ready = false;

    const header_ready_callbacks = [];
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

    const onLoad = async () => {
        try {
            // Initialize React components
            // Note: Both components need to share the same HeaderProvider instance
            // This is handled in header.jsx which renders both components
            const headerContainer = getElementById('header-container');
            if (headerContainer) {
                initHeaderComponent();
            }
            
            updateLoginButtonsDisplay();
            
            // Call topbar detection for fullscreen button
            waitForTopbarElements();
            bindClick();
            
            await BinarySocket.wait('balance');

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

    const onUnload = () => {
        fullscreen_map.event.forEach((event) => {
            document.removeEventListener(event, onFullScreen);
        });
    };

    const onFullScreen = () => {
        is_full_screen = fullscreen_map.element.some((el) => document[el]);
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
        
        // If user is logged in, reset token exchange flag (authentication completed successfully)
        if (!is_logged_out && window.tokenExchangeInProgress) {
            window.tokenExchangeInProgress = false;
        }
        
        // Check if token exchange is in progress and user is not logged in - if so, show skeleton loaders
        if (window.tokenExchangeInProgress && is_logged_out) {
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

        // Note: Mobile menu is now fully handled by React components

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

        // Language selector
        const current_language = Language.get();

        const el_language_select_text = getElementById('language-select__text');
        if (el_language_select_text) {
            el_language_select_text.textContent = current_language ? current_language.toUpperCase() : 'EN';
        }

        // const el_language_select_img = getElementById('language-select__logo');
        // if (el_language_select_img) {
        //     el_language_select_img.src = Url.urlForStatic(
        //         `images/languages/ic-flag-${current_language.toLowerCase()}.svg?${
        //             process.env.BUILD_HASH
        //         }`
        //     );
        // }

        const language_select = getElementById('language-select');
        if (language_select) {
            language_select.addEventListener('click', () => {
                if (window.toggleLanguagePopup) {
                    window.toggleLanguagePopup();
                }
            });
        }
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
