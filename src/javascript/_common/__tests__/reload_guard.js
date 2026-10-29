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
        it('reloads quickly for occasional account changes', () => {
            expect(nextPageLoadDelay()).to.eq(100);
            clock.tick(1000);
            expect(nextPageLoadDelay()).to.eq(100);
            clock.tick(1000);
            expect(nextPageLoadDelay()).to.eq(100);
        });

        it('counts the events of one page load only once', () => {
            expect(ReloadGuard.getStorageReloadDelay()).to.eq(100);
            expect(ReloadGuard.getStorageReloadDelay()).to.eq(100);
            expect(JSON.parse(sessionStorage.getItem('storage_event_reloads'))).to.have.lengthOf(1);
        });

        it('backs off exponentially when reloads keep coming', () => {
            [100, 100, 100, 5000, 10000, 20000].forEach((expected) => {
                expect(nextPageLoadDelay()).to.eq(expected);
                clock.tick(200);
            });
        });

        it('caps the backoff and resets once reloads stop', () => {
            for (let i = 0; i < 10; i++) {
                nextPageLoadDelay();
            }
            expect(nextPageLoadDelay()).to.eq(60000);

            clock.tick(31000);
            expect(nextPageLoadDelay()).to.eq(100);
        });
    });
});
