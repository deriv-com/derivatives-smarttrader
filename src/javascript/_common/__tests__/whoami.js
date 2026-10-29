const { expect } = require('chai');
const sinon      = require('sinon');
const WhoAmI     = require('../whoami');

const makeResponse = (status, body, headers = {}) => ({
    status,
    ok        : status >= 200 && status < 300,
    statusText: '',
    headers   : { get: name => headers[name] },
    json      : () => (body === undefined ? Promise.reject(new Error('not json')) : Promise.resolve(body)),
});

describe('WhoAmI', () => {
    let clock;
    let original_fetch;

    beforeEach(() => {
        WhoAmI.reset();
        clock          = sinon.useFakeTimers({ now: 1000000, toFake: ['Date'] });
        original_fetch = global.fetch;
    });

    afterEach(() => {
        clock.restore();
        global.fetch = original_fetch;
    });

    describe('.checkWhoAmI()', () => {
        it('returns success for a valid session', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(200, { id: 'session' }));
            const result = await WhoAmI.checkWhoAmI();
            expect(result).to.deep.eq({ success: true, data: { id: 'session' } });
        });

        it('returns 401 from the HTTP status or the response body', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(401, undefined));
            expect((await WhoAmI.checkWhoAmI()).error.code).to.eq(401);

            global.fetch = sinon.stub().resolves(makeResponse(200, { error: { code: 401 } }));
            expect((await WhoAmI.checkWhoAmI()).error.code).to.eq(401);
        });

        it('reports 429 as rate limited, never as 401 or success', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(429, { error: { code: 429 } }));
            const result = await WhoAmI.checkWhoAmI();
            expect(result.success).to.eq(undefined);
            expect(result.error.code).to.eq(429);
        });

        it('does not call whoami again until the Retry-After backoff has passed', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(429, undefined, { 'Retry-After': '20' }));
            await WhoAmI.checkWhoAmI();
            expect(global.fetch.callCount).to.eq(1);

            clock.tick(19000);
            expect((await WhoAmI.checkWhoAmI()).error.code).to.eq(429);
            expect(global.fetch.callCount).to.eq(1);

            clock.tick(2000);
            global.fetch = sinon.stub().resolves(makeResponse(200, {}));
            expect((await WhoAmI.checkWhoAmI()).success).to.eq(true);
            expect(global.fetch.callCount).to.eq(1);
        });

        it('backs off exponentially on repeated 429s without Retry-After', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(429, undefined));
            await WhoAmI.checkWhoAmI();
            clock.tick(5000);
            await WhoAmI.checkWhoAmI();
            expect(global.fetch.callCount).to.eq(2);

            // second backoff is 10s
            clock.tick(9000);
            await WhoAmI.checkWhoAmI();
            expect(global.fetch.callCount).to.eq(2);
            clock.tick(1000);
            await WhoAmI.checkWhoAmI();
            expect(global.fetch.callCount).to.eq(3);
        });

        it('shares one request between concurrent callers', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(200, {}));
            const results = await Promise.all([WhoAmI.checkWhoAmI(), WhoAmI.checkWhoAmI(), WhoAmI.checkWhoAmI()]);
            expect(global.fetch.callCount).to.eq(1);
            results.forEach(result => expect(result.success).to.eq(true));
        });

        it('reuses the last result when it is younger than max_age', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(200, {}));
            await WhoAmI.checkWhoAmI({ max_age: 30000 });
            clock.tick(29000);
            await WhoAmI.checkWhoAmI({ max_age: 30000 });
            expect(global.fetch.callCount).to.eq(1);

            clock.tick(2000);
            await WhoAmI.checkWhoAmI({ max_age: 30000 });
            expect(global.fetch.callCount).to.eq(2);
        });

        it('always calls whoami when max_age is not given', async () => {
            global.fetch = sinon.stub().resolves(makeResponse(200, {}));
            await WhoAmI.checkWhoAmI();
            await WhoAmI.checkWhoAmI();
            expect(global.fetch.callCount).to.eq(2);
        });

        it('returns an error without a 401 code on network failure', async () => {
            const console_error = sinon.stub(console, 'error');
            global.fetch = sinon.stub().rejects(new TypeError('Failed to fetch'));
            const result = await WhoAmI.checkWhoAmI();
            console_error.restore();
            expect(result.error.code).to.eq(undefined);
        });
    });
});
