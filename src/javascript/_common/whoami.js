/**
 * WhoAmI - Session validation via REST API
 *
 * Checks session validity by calling the whoami endpoint
 * Used to verify authentication status without WebSocket
 */

const { getWhoAmIURL } = require('../../templates/_common/brand.config');

/**
 * Check session validity via REST API whoami endpoint
 * @returns {Promise<Object>} Promise with response data: { success: true } or { error: { code: 401, status: 'Unauthorized' } }
 */
const checkWhoAmI = async () => {
    try {
        const whoamiUrl = getWhoAmIURL();

        const response = await fetch(whoamiUrl, {
            method     : 'GET',
            credentials: 'include',
            headers    : {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        // Check for 401 Unauthorized error in response body
        if (data.error && (data.error.code === 401 || data.error.status === 'Unauthorized')) {
            return { error: { code: 401, status: 'Unauthorized' } };
        }

        // Return success response
        return { success: true, data };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[WhoAmI Error]', error);
        // Return error but don't trigger cleanup for network errors
        return { error: { message: error.message } };
    }
};

module.exports = {
    checkWhoAmI,
};
