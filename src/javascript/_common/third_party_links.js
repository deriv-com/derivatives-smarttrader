const { localize }          = require('@deriv-com/translations');
const BinarySocket           = require('../app/base/socket');
const Dialog                 = require('../app/common/attach_dom/dialog');
const isEuCountry            = require('../app/common/country_base').isEuCountry;
const getCurrentBinaryDomain = require('../config').getCurrentBinaryDomain;

const ThirdPartyLinks = (() => {
    const init = () => {
        BinarySocket.wait('balance').then(() => {
            document.body.addEventListener('click', clickHandler);
        });
    };

    const clickHandler = (e) => {
        if (!e.target) return;
        const el_link = e.target.closest('a') || e.target.closest('area');
        if (!el_link) return;

        const href = el_link.href;
        if (isEuCountry()) {
            const dialog = document.querySelector('#third_party_redirect_dialog');
            if (dialog && dialog.contains(el_link)) return;

            if (isThirdPartyLink(href)) {
                e.preventDefault();
                showThirdPartyLinkPopup(href);
            }
        } else {
            const dialog = document.querySelector('#telegram_installation_dialog');
            if (dialog && dialog.contains(el_link)) return;

            if (isTelegramLink(href)) {
                e.preventDefault();
                showTelegramPopup(href);
            }
        }
    };

    const openThirdPartyLink = (href) => {
        const link = window.open();
        link.opener = null;
        link.location = href;
    };

    const showThirdPartyLinkPopup = (href) => {
        // show third-party website redirect notification for logged in and logged out EU clients
        Dialog.confirm({
            id               : 'third_party_redirect_dialog',
            localized_message: localize(['You will be redirected to a third-party website which is not owned by Binary.com.', 'Click OK to proceed.']),
        }).then((should_proceed) => {
            if (should_proceed && isTelegramLink(href))  {
                showTelegramPopup(href);
            } else if (should_proceed) {
                openThirdPartyLink(href);
            }
        });
    };

    const showTelegramPopup = (href) => {
        // show a popup to remind clients to have Telegram app installed on their device
        Dialog.confirm({
            id               : 'telegram_installation_dialog',
            localized_message: localize(['Please ensure that you have the Telegram app installed on your device.', 'Click OK to proceed.']),
        }).then((should_proceed) => {
            if (should_proceed) {
                openThirdPartyLink(href);
            }
        });
    };

    const isTelegramLink = (href) => /t\.me/.test(href);

    const isThirdPartyLink = (href) => {
        let destination;
        try {
            destination = new URL(href);
        } catch (e) {
            return false;
        }
        
        const currentBinaryDomain = getCurrentBinaryDomain() || 'binary.com';
        // Improved hostname validation - escape special regex characters and use more precise patterns
        const escapedDomain = currentBinaryDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        return !!destination.host
            && !new RegExp(`^([a-zA-Z0-9-]+\\.)*${escapedDomain}$`).test(destination.host) // destination host is not binary subdomain
            // TODO: [app-link-refactor] - Remove backwards compatibility for `deriv.app`
            && !/^([a-zA-Z0-9-]+\.)*deriv\.app$/.test(destination.host) // destination host is not deriv.app
            && !/^([a-zA-Z0-9-]+\.)*app\.deriv\.com$/.test(destination.host) // destination host is not app.deriv.com
            && !/^([a-zA-Z0-9-]+\.)*binary\.bot$/.test(destination.host) // destination host is not binary.bot subdomain
            && !/^www\.(betonmarkets|xodds)\.com$/.test(destination.host) // destination host is not binary old domain
            && !/^([a-zA-Z0-9-]+\.)*deriv\.(app|com)$/.test(destination.host) // destination host is not deriv
            && window.location.host !== destination.host;
    };

    return {
        init,
        isThirdPartyLink,
    };
})();

module.exports = ThirdPartyLinks;