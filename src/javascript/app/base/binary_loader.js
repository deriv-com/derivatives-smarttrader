const { localize } = require('@deriv-com/translations');
const BinaryPjax = require('./binary_pjax');
const pages_config = require('./binary_pages');
const Client = require('./client');
const Header = require('./header');
const NetworkMonitor = require('./network_monitor');
const Page = require('./page');
const BinarySocket = require('./socket');
const ContentVisibility = require('../common/content_visibility');
const DerivBanner = require('../common/deriv_banner');
const GTM = require('../../_common/base/gtm');
const Login = require('../../_common/base/login');
const LiveChat = require('../../_common/base/livechat');
const getElementById = require('../../_common/common_functions').getElementById;
const ScrollToAnchor = require('../../_common/scroll_to_anchor');
const isStorageSupported = require('../../_common/storage').isStorageSupported;
const ThirdPartyLinks = require('../../_common/third_party_links');
const urlFor = require('../../_common/url').urlFor;
const createElement = require('../../_common/utility').createElement;
const DevShortcuts = require('../../_common/dev_shortcuts');
const { getI18nInstance, isTranslationsInitialized } = require('../../_common/translation-init');
const { checkWhoAmI } = require('../../_common/whoami');
const { getAccountId } = require('../../config');

const BinaryLoader = (() => {
    let container;
    let active_script = null;

    const init = async () => {
        // Ensure translations are initialized
        if (!isTranslationsInitialized()) {
            // eslint-disable-next-line no-console
            console.warn('Translations not initialized, falling back to legacy system');
        }

        if (!isStorageSupported(localStorage) || !isStorageSupported(sessionStorage)) {
            Header.displayNotification({ key: 'storage_not_supported', title: 'Storage not supported', message: localize('Requires your browser\'s web storage to be enabled in order to function properly. Please enable it or exit private browsing mode.'), type: 'danger' });
            getElementById('btn_login').classList.add('button-disabled');
        }

        // Make i18n instance globally available
        const i18nInstance = getI18nInstance();
        if (i18nInstance) {
            window.smartTraderI18n = i18nInstance;
        }

        Page.showNotificationOutdatedBrowser();

        // Check whoami BEFORE initializing Client to prevent connecting with stale credentials
        const account_id = getAccountId();
        if (account_id) {
            const whoami_result = await checkWhoAmI();

            // If session is invalid (401), clear credentials before any WebSocket connection
            if (whoami_result.error?.code === 401) {
                // Clear credentials to prevent WebSocket from connecting with stale account_id
                localStorage.removeItem('account_id');
                localStorage.removeItem('account_type');
                localStorage.removeItem('active_loginid');
                sessionStorage.removeItem('active_loginid');
                localStorage.removeItem('current_account');
            }
        }

        Client.init();
        NetworkMonitor.init();
        DerivBanner.chooseBanner();
        container = getElementById('content-holder');
        container.addEventListener('binarypjax:before', beforeContentChange);
        window.addEventListener('beforeunload', beforeContentChange);
        container.addEventListener('binarypjax:after', afterContentChange);
        
        try {
            BinaryPjax.init(container, '#content');
        } catch (error) {
            // BinaryPjax initialization error - redirect to home
            window.location.replace(`${window.location.protocol}//${window.location.hostname}`);
        }
        
        ThirdPartyLinks.init();
        DevShortcuts.init();

    };

    const beforeContentChange = () => {
        if (active_script) {
            BinarySocket.removeOnDisconnect();
            BinarySocket.removeOnReconnect();
            if (typeof active_script.onUnload === 'function') {
                active_script.onUnload();
            }
            active_script = null;
        }

        ScrollToAnchor.cleanup();
    };

    const afterContentChange = (e) => {
        Page.onLoad();

        const this_page = e.detail.getAttribute('data-page');
        if (Object.prototype.hasOwnProperty.call(pages_config, this_page)) {
            loadHandler(this_page);
        } else if (/\/get-started\//i.test(window.location.pathname)) {
            loadHandler('get-started');
        }

        // Make sure content is properly loaded or visible before scrolling to anchor.
        ContentVisibility.init().then(() => {
            BinarySocket.wait('balance').then(() => {
                GTM.pushDataLayer({ event: 'page_load' });

                // reroute LiveChat group
                LiveChat.rerouteGroup();

                // first time load.
                const last_image = $('#content img').last();
                if (last_image) {
                    last_image.on('load', () => {
                        ScrollToAnchor.init();
                    });
                }

                ScrollToAnchor.init();

                ContentVisibility.centerAlignSelect(true);
            });
        });

        if (active_script) {
            BinarySocket.setOnReconnect(active_script.onReconnect);
        }
    };

    const error_messages = {
        login            : () => localize('Please <a>log in</a> or <a href="{{signup_url}}">sign up</a> to view this page.', { signup_url: urlFor('new-account') }),
        only_virtual     : () => localize('Sorry, this feature is available to virtual accounts only.'),
        only_real        : () => localize('This feature is not relevant to virtual-money accounts.'),
        not_authenticated: () => localize('This page is only available to logged out clients.'),
        no_mf            : () => localize('Sorry, but binary options trading is not available in your financial account.'),
        offerings_blocked: () => localize('Sorry, options trading isn’t available in the United Kingdom and the Isle of Man.'),
        options_blocked  : () => localize('Sorry, but binary options trading is not available in your country.'),
    };

    const loadHandler = (this_page) => {
        const config = { ...pages_config[this_page] };
        active_script = config.module;
        if (config.is_authenticated) {
            if (!Client.isLoggedIn()) {
                displayMessage(error_messages.login());
            } else {
                BinarySocket.wait('balance')
                    .then((response) => {
                        if (response.error) {
                            displayMessage(error_messages.login());
                        } else if (config.only_virtual && !Client.get('is_virtual')) {
                            displayMessage(error_messages.only_virtual());
                        } else if (config.only_real && Client.get('is_virtual')) {
                            displayMessage(error_messages.only_real());
                        } else {
                            loadActiveScript();
                        }
                    });
            }
        } else if (config.not_authenticated && Client.isLoggedIn()) {
            if (this_page === 'home' || this_page === 'new-account') {
                BinaryPjax.load(`${Client.defaultRedirectUrl()}${window.location.search}`, true);
            } else {
                handleNotAuthenticated();
            }
        } else {
            loadActiveScript();
        }
        
        BinarySocket.wait('balance').then(() => {
            // Removed account type and regional restrictions - allow all account types
            // Original restrictions removed: isOptionsBlocked(), isOfferingBlocked(), isAccountOfType('financial')
        });

        BinarySocket.setOnDisconnect(active_script.onDisconnect);
    };

    const loadActiveScript = () => {
        if (active_script && typeof active_script.onLoad === 'function') {
            // Load script directly without waiting for website_status
            active_script.onLoad();
        }
    };

    const displayMessage = (localized_message) => {
        const content = container.querySelector('#content .container');
        if (!content) {
            return;
        }

        const div_container = createElement('div', { class: 'logged_out_title_container', html: Client.isOptionsBlocked() ? '' : content.getElementsByTagName('h1')[0] || '' });
        const div_notice = createElement('p', { class: 'center-text notice-msg', html: localized_message });

        div_container.appendChild(div_notice);

        content.html(div_container);

        const link = content.getElementsByTagName('a')[0];
        if (link) {
            link.addEventListener('click', () => { Login.redirectToLogin(); });
        }
    };

    // displayUnavailable function removed - no longer needed without account restrictions

    const handleNotAuthenticated = () => {
        const content = container.querySelector('#content');
        if (!content) {
            return;
        }
        content.classList.add('container');

        const outer_container = createElement('div', { class: 'logged_out_title_container' });
        outer_container.appendChild(container.querySelector('#page_info'));
        outer_container.appendChild(container.getElementsByTagName('h1')[0]);

        const rowDiv = (element) => {
            const row_element = createElement('div', { class: 'gr-padding-10' });
            row_element.appendChild(element);
            return row_element;
        };
        const inner_container = createElement('div', { class: 'center-text' });
        const error_msg = createElement('div', { class: 'center-text notice-msg', text: error_messages.not_authenticated() });
        const logout_cta = createElement('button');
        const logout_span = createElement('span', { text: localize('Sign out') });

        logout_cta.addEventListener('click', () => { Client.doLogout({ logout: 1 }); });
        logout_cta.appendChild(logout_span);
        inner_container.appendChild(rowDiv(error_msg));
        inner_container.appendChild(rowDiv(logout_cta));
        outer_container.append(inner_container);
        content.html(outer_container);
    };

    return {
        init,
    };
})();

module.exports = BinaryLoader;
