const { localize } = require('@deriv-com/translations');
const Cookies          = require('js-cookie');
const moment           = require('moment');
const Client           = require('./client');
const Contents         = require('./contents');
const Header           = require('./header');
const Menu             = require('./menu');
const BinarySocket     = require('./socket');
const TrafficSource    = require('../common/traffic_source');
const RealityCheck     = require('../pages/user/reality_check/reality_check');
const Elevio           = require('../../_common/base/elevio');
const Login            = require('../../_common/base/login');
const elementInnerHtml = require('../../_common/common_functions').elementInnerHtml;
const getElementById   = require('../../_common/common_functions').getElementById;
const GTM              = require('../../_common/gtm');
const Language         = require('../../_common/language');
const isMobile         = require('../../_common/os_detect').isMobile;
const LocalStore       = require('../../_common/storage').LocalStore;
const SessionStore     = require('../../_common/storage').SessionStore;
const State            = require('../../_common/storage').State;
const scrollToTop      = require('../../_common/scroll').scrollToTop;
const toISOFormat      = require('../../_common/string_util').toISOFormat;
const Url              = require('../../_common/url');
const Analytics        = require('../../_common/analytics');
const { requestSingleSignOn, requestSingleLogout } = require('../../_common/auth');
const Chat             = require('../../_common/chat.js').default;
const createElement    = require('../../_common/utility').createElement;
const isLoginPages     = require('../../_common/utility').isLoginPages;
const isProduction     = require('../../config').isProduction;
require('../../_common/lib/polyfills/array.includes');
require('../../_common/lib/polyfills/string.includes');

const Page = (() => {
    const init = () => {
        State.set('is_loaded_by_pjax', false);
        GTM.init();
        Url.init();
        Elevio.init();
        onDocumentReady();
        // Crowdin removed - using @deriv-com/translations instead
        Analytics.init();
    };

    const handleAccountsChange = (newValue, oldValue) => {
        const removedSessionAndBalance = (input) => {
            const filtered_account = input
                .replace(/"balance":[+-]?([0-9]*[.])?[0-9]+/g, '')
                .replace(/"session_start":([0-9]+),/g, '');
            return filtered_account;
        };

        const new_account = JSON.parse(newValue || '{}');
        const old_account = JSON.parse(oldValue || '{}');
        
        const new_currency = new_account.currency || '';
        const old_currency = old_account.currency || '';

        // Check for account in URL param, if missing add currency or demo
        if (!Url.param('account') && new_account.loginid) {
            const account_param = /^VR/.test(new_account.loginid) ? 'demo' : new_account.currency;
            if (account_param) {
                Url.updateParamsWithoutReload({ account: account_param }, true);
            }
        }

        if (removedSessionAndBalance(newValue) !== removedSessionAndBalance(oldValue || '{}') &&
            old_currency !== new_currency) {
            reload();
        }
    };

    const onDocumentReady = () => {
        // LocalStorage can be used as a means of communication among
        // different windows. The problem that is solved here is what
        // happens if the user logs out or switches loginid in one
        // window while keeping another window or tab open. This can
        // lead to unintended trades. The solution is to reload the
        // page in all windows after switching loginid or after logout.

        // onLoad.queue does not work on the home page.
        // jQuery's ready function works always.
        $(document).ready(() => {
            // Cookies is not always available.
            // So, fall back to a more basic solution.
            const handleStorageEvent = (evt) => {
                switch (evt.key) {
                    case 'account_id':
                    case 'account_type':
                        if (evt.newValue !== evt.oldValue) {
                            setTimeout(() => {
                                window.location.reload();
                            }, 100);
                        }
                        break;
                    case 'current_account':
                        if (evt.newValue !== evt.oldValue) {
                            handleAccountsChange(evt.newValue, evt.oldValue);
                        }
                        break;
                    case 'new_release_reload_time':
                        if (evt.newValue !== evt.oldValue) {
                            reload(true);
                        }
                        break;
                    // no default
                }
            };

            // Listen for storage events from other windows
            window.addEventListener('storage', handleStorageEvent);

            // Watch for changes in the current window
            const originalSetItem = LocalStore.setObject;
            const originalSet = LocalStore.set;

            LocalStore.setObject = function(key, value) {
                const oldValue = LocalStore.getObject(key);
                originalSetItem.apply(this, [key, value]);
                if (key === 'current_account') {
                    handleAccountsChange(JSON.stringify(value), JSON.stringify(oldValue));
                }
            };

            LocalStore.set = function(key, value) {
                originalSet.apply(this, [key, value]);
                if (key === 'active_loginid') {
                    const session_loginid = SessionStore.get('active_loginid');
                    if (session_loginid && session_loginid !== value) {
                        LocalStore.set('active_loginid', session_loginid);
                    }
                }
            };

            scrollToTop();
        });
    };

    const onLoad = () => {
        if (State.get('is_loaded_by_pjax')) {
            Url.reset();
            updateLinksURL('#content');

        } else {
            init();

            // if the user has logged in previously, silent login
            requestSingleSignOn();
            // if the user has logged out previously, silent logout
            requestSingleLogout(Client.sendLogoutRequest);

            if (!isLoginPages()) {
                // Use proper language detection instead of urlLang
                Language.setCookie(Language.get());
                const url_query_strings = Url.paramsHash();

                if (url_query_strings['data-elevio-article']) {
                    Elevio.injectElevio();
                }

                // Handle opening livechat via URL
                const is_livechat_open = url_query_strings.is_livechat_open === 'true';
                if (is_livechat_open) {
                    Chat.openWithParam();
                }
            }
            Header.onLoad();
            Language.setCookie();
            Menu.makeMobileMenu();
            Menu.makeMobileMenuOnResize();
            updateLinksURL('body');
            recordAffiliateExposure();
            endpointNotification();

        }
        Contents.onLoad();

        if (sessionStorage.getItem('showLoginPage') && !sessionStorage.getItem('closingAccount')) {
            sessionStorage.removeItem('showLoginPage');
            Login.redirectToLogin();
        }
        if (Client.isLoggedIn()) {
            BinarySocket.wait('balance').then(() => {
                RealityCheck.onLoad();
                Menu.init();
                
                // Check whoami on init after logged in
                Client.performWhoAmICheck();
                
                // Setup visibility listener to check whoami when tab becomes visible
                Client.setupVisibilityListener();
            });
        } else {
            Menu.init();
            if (!LocalStore.get('date_first_contact')) {
                BinarySocket.wait('time').then((response) => {
                    LocalStore.set('date_first_contact', toISOFormat(moment(response.time * 1000).utc()));
                });
            }
            if (!LocalStore.get('signup_device')) {
                LocalStore.set('signup_device', (isMobile() ? 'mobile' : 'desktop'));
            }
        }
        TrafficSource.setData();
    };

    const recordAffiliateExposure = () => {
        const token = Url.param('t');
        if (!token || token.length !== 32) {
            return false;
        }

        const token_length  = token.length;
        const is_subsidiary = /\w{1}/.test(Url.param('s'));

        const cookie_token = Cookies.getJSON('affiliate_tracking');
        if (cookie_token) {
            // Already exposed to some other affiliate.
            if (is_subsidiary && cookie_token && cookie_token.t) {
                return false;
            }
        }

        // Record the affiliate exposure. Overwrite existing cookie, if any.
        const cookie_hash = {};
        if (token_length === 32) {
            cookie_hash.t = token.toString();
        }
        if (is_subsidiary) {
            cookie_hash.s = '1';
        }

        Cookies.set('affiliate_tracking', cookie_hash, {
            expires : 365, // expires in 365 days
            path    : '/',
            domain  : `.${location.hostname.split('.').slice(-2).join('.')}`,
            sameSite: 'none',
            secure  : true,
        });
        return true;
    };

    const reload = (forced_reload) => { window.location.reload(!!forced_reload); };

    const endpointNotification = () => {
        const server = localStorage.getItem('config.server_url');
        if (server && server.length > 0) {
            const message = `${(isProduction() ? '' :
                `${localize('This is a staging server - For testing purposes only')} - `)}
                ${localize('The server <a href="{{endpoint_url}}">endpoint</a> is: {{server}}', { endpoint_url: Url.urlFor('endpoint'), server })}`;

            const end_note = getElementById('end-note');
            elementInnerHtml(end_note, message);
            end_note.setVisibility(1);
        }
    };

    const showNotificationOutdatedBrowser = () => {
        const src = '//browser-update.org/update.min.js';
        if (document.querySelector(`script[src*="${src}"]`)) return;
        window.$buoop = {
            vs     : { i: 17, f: -4, o: -4, s: 9, c: 65 }, // it will support this number and above, or the latest -versions
            api    : 4,
            l      : Language.get().toLowerCase(),
            url    : 'https://browsehappy.com/',
            noclose: true, // Do not show the 'ignore' button to close the notification
            text   : localize('Your web browser ({{browser_name}}) is out of date and may affect your trading experience. Proceed at your own risk. <a href="{{url}}" target="_blank">Update browser</a>',
                { browser_name: '{brow_name}', url: 'https://browsehappy.com/' }),
            reminder: 0, // show all the time
        };
        if (document.body) {
            document.body.appendChild(createElement('script', { src }));
        }
    };

    const updateLinksURL = (container_selector) => {
        $(container_selector).find(`a[href*=".${Url.getDefaultDomain()}"]`).each(function() {
            $(this).attr('href', Url.urlForCurrentDomain($(this).attr('href')));
        });
    };

    return {
        onLoad,
        showNotificationOutdatedBrowser,
    };
})();

module.exports = Page;
