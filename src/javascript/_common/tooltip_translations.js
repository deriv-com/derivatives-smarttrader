/**
 * Tooltip Translations - Updates tooltip text when language changes
 *
 * This module ensures that tooltips using data-balloon attributes are properly
 * translated when the language changes.
 */

const { localize } = require('@deriv-com/translations');

/**
 * Updates tooltip translations for elements with data-balloon-id attributes
 * This function should be called when the language changes
 */
const updateTooltipTranslations = () => {
    // Update logout tooltip
    const logoutTooltip = document.getElementById('topbar-logout');
    if (logoutTooltip) {
        logoutTooltip.setAttribute('data-balloon', localize('Log out'));
    }

    // Add more tooltips here as needed
};

module.exports = {
    updateTooltipTranslations,
};
