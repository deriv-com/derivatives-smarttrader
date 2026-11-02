/**
 * ReloadGuard - slows down cross-tab reload loops
 *
 * Tabs reload when another tab changes account_id/account_type in localStorage.
 * If reloading itself changes those keys again, open tabs keep reloading each other
 * (and re-run whoami on every load). Reloads stay quick normally, but once a tab has been
 * reloaded by storage events several times in a row, each further reload is delayed
 * with an exponential backoff. The tab still reloads eventually, so it never keeps trading on
 * a stale account. The run of reloads only resets after a quiet period longer than the last
 * delay, so the backoff can grow to its cap. State is kept in sessionStorage so it survives
 * the reloads.
 */

const STORAGE_KEY     = 'storage_event_reloads';
const DEFAULT_DELAY   = 100;
const FREE_RELOADS    = 3;
const QUIET_MS        = 30 * 1000;
const BASE_BACKOFF_MS = 5 * 1000;
const MAX_BACKOFF_MS  = 60 * 1000;

// One account change fires a storage event per key, so record at most once per page load
let pending_delay = null;

const getLastRun = () => {
    try {
        const run = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        return run && typeof run.count === 'number' ? run : null;
    } catch (e) {
        return null;
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

    const now      = Date.now();
    const last_run = getLastRun();
    const is_quiet = !last_run || now - last_run.time > last_run.delay + QUIET_MS;
    const count    = is_quiet ? 1 : last_run.count + 1;

    pending_delay = count <= FREE_RELOADS
        ? DEFAULT_DELAY
        : Math.min(BASE_BACKOFF_MS * (2 ** (count - FREE_RELOADS - 1)), MAX_BACKOFF_MS);

    try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ count, time: now, delay: pending_delay }));
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
