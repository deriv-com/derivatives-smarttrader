const { expect }  = require('chai');
const sinon       = require('sinon');
const ReloadGuard = require('../reload_guard');

describe('ReloadGuard', () => {
    let clock;
    let original_session_storage;

    before(() => {
        original_session_storage = global.sessionStorage;
        const store = {};
        global.sessionStorage = {
            getItem: key => (key in store ? store[key] : null),
            setItem: (key, value) => { store[key] = String(value); },
            clear  : () => Object.keys(store).forEach(key => delete store[key]),
        };
    });

    after(() => {
        global.sessionStorage = original_session_storage;
    });

    // Each call simulates a fresh page load in the same tab
    const nextPageLoadDelay = () => {
        ReloadGuard.reset();
        return ReloadGuard.getStorageReloadDelay();
    };

    beforeEach(() => {
        sessionStorage.clear();
        ReloadGuard.reset();
        clock = sinon.useFakeTimers({ now: 1000000, toFake: ['Date'] });
    });

    afterEach(() => {
        clock.restore();
    });

    describe('.getStorageReloadDelay()', () => {
        // Simulates a loop: the tab waits out each delay, takes PAGE_LOAD_MS to load, then gets the next event
        const PAGE_LOAD_MS = 3000;
        const runLoop = (reloads) => {
            const delays = [];
            for (let i = 0; i < reloads; i++) {
                const delay = nextPageLoadDelay();
                delays.push(delay);
                clock.tick(delay + PAGE_LOAD_MS);
            }
            return delays;
        };

        it('reloads quickly for occasional account changes', () => {
            for (let i = 0; i < 5; i++) {
                expect(nextPageLoadDelay()).to.eq(100);
                clock.tick(31000);
            }
        });

        it('counts the events of one page load only once', () => {
            expect(ReloadGuard.getStorageReloadDelay()).to.eq(100);
            expect(ReloadGuard.getStorageReloadDelay()).to.eq(100);
            expect(JSON.parse(sessionStorage.getItem('storage_event_reloads')).count).to.eq(1);
        });

        it('backs off exponentially up to the cap while the loop continues', () => {
            expect(runLoop(10)).to.deep.eq([100, 100, 100, 5000, 10000, 20000, 40000, 60000, 60000, 60000]);
        });

        it('resets after a quiet period longer than the last delay', () => {
            runLoop(8);
            // last delay was 60s, so a gap of 60s + load time is still part of the loop
            expect(nextPageLoadDelay()).to.eq(60000);

            clock.tick(60000 + 31000);
            expect(nextPageLoadDelay()).to.eq(100);
        });

        it('ignores state saved in the old format', () => {
            sessionStorage.setItem('storage_event_reloads', JSON.stringify([Date.now(), Date.now(), Date.now()]));
            expect(nextPageLoadDelay()).to.eq(100);
        });
    });
});
