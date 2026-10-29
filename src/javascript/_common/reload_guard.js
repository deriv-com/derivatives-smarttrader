/**
 * ReloadGuard - slows down cross-tab reload loops
 *
 * Tabs reload when another tab changes account_id/account_type in localStorage.
 * If reloading itself changes those keys again, open tabs keep reloading each other
 * (and re-run whoami on every load). Reloads stay quick normally, but once a tab has been
 * reloaded by storage events several times in a short window, each further reload is delayed
 * with an exponential backoff. The tab still reloads eventually, so it never keeps trading on
 * a stale account. Reload times are kept in sessionStorage so they survive the reloads.
 */

const STORAGE_KEY     = 'storage_event_reloads';
const DEFAULT_DELAY   = 100;
const FREE_RELOADS    = 3;
const WINDOW_MS       = 30 * 1000;
const BASE_BACKOFF_MS = 5 * 1000;
const MAX_BACKOFF_MS  = 60 * 1000;

// One account change fires a storage event per key, so record at most once per page load
let pending_delay = null;

const getRecentReloads = (now) => {
    try {
        const timestamps = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        return Array.isArray(timestamps) ? timestamps.filter(time => now - time < WINDOW_MS) : [];
    } catch (e) {
        return [];
    }
};

/**
 * Records a storage-event reload and returns how long to wait before reloading
 * @returns {number} delay in ms
 */
const getStorageReloadDelay = () => {
    if (pending_delay !== null) {
        return pending_delay;
    }

    const now     = Date.now();
    const reloads = getRecentReloads(now);
    const excess  = reloads.length - FREE_RELOADS;

    pending_delay = excess < 0
        ? DEFAULT_DELAY
        : Math.min(BASE_BACKOFF_MS * (2 ** excess), MAX_BACKOFF_MS);

    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...reloads, now]));
    } catch (e) {
        // sessionStorage unavailable: nothing to record
    }
    return pending_delay;
};

const reset = () => {
    pending_delay = null;
};

module.exports = {
    getStorageReloadDelay,
    reset,
};
