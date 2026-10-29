/**
 * WhoAmI - Session validation via REST API
 *
 * Checks session validity by calling the whoami endpoint
 * Used to verify authentication status without WebSocket
 *
 * The auth provider rate limits whoami (120 calls/min per browser session), so calls are:
 * - single-flight: concurrent callers share one request
 * - optionally served from the last result when it is younger than `max_age`
 * - paused after an HTTP 429 until Retry-After (or an exponential backoff) has passed
 * A 429 is never reported as 401, so callers must not treat it as a logout.
 */

const { getWhoAmIURL } = require('../../templates/_common/brand.config');

const BASE_BACKOFF_MS = 5 * 1000;
const MAX_BACKOFF_MS  = 5 * 60 * 1000;

const UNAUTHORIZED_RESULT = { error: { code: 401, status: 'Unauthorized' } };
const RATE_LIMITED_RESULT = { error: { code: 429, status: 'Too Many Requests' } };

let pending_request    = null;
let last_result        = null;
let last_result_time   = 0;
let rate_limited_until = 0;
let rate_limit_count   = 0;

const getBackoffMs = (response) => {
    const retry_after = Number(response.headers?.get?.('Retry-After'));
    if (retry_after > 0) {
        return Math.min(retry_after * 1000, MAX_BACKOFF_MS);
    }
    return Math.min(BASE_BACKOFF_MS * (2 ** (rate_limit_count - 1)), MAX_BACKOFF_MS);
};

const requestWhoAmI = async () => {
    try {
        const response = await fetch(getWhoAmIURL(), {
            method     : 'GET',
            credentials: 'include',
            headers    : {
                'Content-Type': 'application/json',
            },
        });

        if (response.status === 429) {
            rate_limit_count++;
            rate_limited_until = Date.now() + getBackoffMs(response);
            return RATE_LIMITED_RESULT;
        }
        rate_limit_count = 0;

        let data = null;
        try {
            data = await response.json();
        } catch (e) {
            data = null;
        }

        if (response.status === 401 ||
            (data?.error && (data.error.code === 401 || data.error.status === 'Unauthorized'))) {
            return UNAUTHORIZED_RESULT;
        }

        if (!response.ok) {
            return { error: { code: response.status, status: response.statusText } };
        }

        return { success: true, data };
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('[WhoAmI Error]', error);
        // Return error but don't trigger cleanup for network errors
        return { error: { message: error.message } };
    }
};

/**
 * Check session validity via REST API whoami endpoint
 * @param {Object} [options]
 * @param {number} [options.max_age] - reuse the last result if it is younger than this (ms)
 * @returns {Promise<Object>} { success: true, data }, { error: { code: 401 } } for an invalid session,
 *                            { error: { code: 429 } } while rate limited, or another { error }
 */
const checkWhoAmI = async ({ max_age = 0 } = {}) => {
    if (pending_request) {
        return pending_request;
    }

    const now = Date.now();
    if (now < rate_limited_until) {
        return RATE_LIMITED_RESULT;
    }
    if (max_age > 0 && last_result && now - last_result_time < max_age) {
        return last_result;
    }

    pending_request = requestWhoAmI().then((result) => {
        last_result      = result;
        last_result_time = Date.now();
        pending_request  = null;
        return result;
    });

    return pending_request;
};

const reset = () => {
    pending_request    = null;
    last_result        = null;
    last_result_time   = 0;
    rate_limited_until = 0;
    rate_limit_count   = 0;
};

module.exports = {
    checkWhoAmI,
    reset,
};
