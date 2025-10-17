
const Client                  = require('../client_base');
const setCurrencies           = require('../currency_base').setCurrencies;
const { api, expect, setURL } = require('../../__tests__/tests_common');
const State                   = require('../../storage').State;
const Url                     = require('../../url');

describe('ClientBase', () => {
    const loginid_invalid   = 'ZZ123456789';
    const loginid_virtual   = 'VRTC123456789';
    const loginid_real      = 'CR123456789';
    const loginid_real_2    = 'CR123456788';
    const loginid_real_iom  = 'MX123';
    const loginid_gaming    = 'MLT123';
    const loginid_financial = 'MF123';

    const landing_company = { landing_company: { financial_company: { name: 'Binary Investments (Europe) Ltd', shortcode: 'maltainvest' }, gaming_company: { name: 'Binary (Europe) Ltd', shortcode: 'malta' } }, msg_type: 'landing_company' };
    const valid_landing_company =
    { landing_company: { financial_company: { name: 'Binary Investments (Europe) Ltd', shortcode: 'maltainvest', legal_allowed_currencies: ['USD'] }, gaming_company: { name: 'Binary (Europe) Ltd', shortcode: 'malta', legal_allowed_currencies: ['USD'] } }, msg_type: 'landing_company' };
    const authorize       = { authorize: { upgradeable_landing_companies: [] }};


    describe('.(set|get)()', () => {
        it('sets and gets for expected client', () => {
            // In single-account system, we only work with current account
            Client.set('currency', 'USD');
            expect(Client.get('currency')).to.eq('USD');
            Client.set('currency', 'EUR');
            expect(Client.get('currency')).to.eq('EUR');
        });
        it('returns expected data types', () => {
            Client.set('number', 1);
            expect(Client.get('number')).to.be.a('Number').and.to.eq(1);
            Client.set('float', 1.12345);
            expect(Client.get('float')).to.be.a('Number').and.to.eq(1.12345);
            const obj_nested = { a: { b: 'test' } };
            Client.set('object', obj_nested);
            expect(Client.get('object')).to.be.an('Object').and.to.deep.eq(obj_nested);
            Client.set('bool', true);
            expect(Client.get('bool')).to.be.a('boolean').and.to.eq(true);
            Client.set('undef', undefined);
            expect(Client.get('undef')).to.eq(undefined);
        });
    });


    describe('.getAccountType()', () => {
        it('works as expected', () => {
            expect(Client.getAccountType(loginid_virtual)).to.eq('virtual');
            expect(Client.getAccountType(loginid_real)).to.eq(undefined);
            expect(Client.getAccountType(loginid_gaming)).to.eq('gaming');
            expect(Client.getAccountType(loginid_financial)).to.eq('financial');
        });
    });

    describe('.isAccountOfType()', () => {
        it('works as expected', () => {
            expect(Client.isAccountOfType('virtual', loginid_virtual)).to.eq(true);
            expect(Client.isAccountOfType('real', loginid_real)).to.eq(true);
        });
    });

    describe('.getAccountOfType()', () => {
        it('works as expected', () => {
            // In single-account system, we work with current account only
            Client.set('loginid', loginid_virtual);
            expect(Client.getAccountOfType('virtual')).to.not.eq(undefined);
            Client.set('loginid', loginid_real);
            expect(Client.getAccountOfType('real')).to.not.eq(undefined);
            Client.set('loginid', loginid_financial);
            expect(Client.getAccountOfType('financial')).to.not.eq(undefined);
        });
        it('doesn\'t return disabled account if enabled_only flag is set', () => {
            Client.set('is_disabled', 1);
            expect(Client.getAccountOfType('financial', 1)).to.deep.eq({});
        });
    });

    describe('.hasAccountType()', () => {
        it('works as expected', () => {
            Client.set('loginid', loginid_financial);
            expect(Client.hasAccountType('financial')).to.eq(true);
        });
        it('doesn\'t return disabled account if enabled_only flag is set', () => {
            Client.set('is_disabled', 1);
            expect(Client.hasAccountType('financial', 1)).to.eq(false);
        });
    });

    describe('.hasCurrencyType()', () => {
        it('works as expected', () => {
            Client.clearAllAccounts();
            Client.set('loginid', loginid_real);
            Client.set('currency', 'USD');
            Client.set('is_virtual', 0);
            expect(Client.hasCurrencyType('fiat')).to.eq(true);
            expect(Client.hasCurrencyType('crypto')).to.eq(false);
        });
    });

    describe('.clearAllAccounts()', () => {
        it('works as expected', () => {
            Client.clearAllAccounts();
            expect(Client.get()).to.deep.eq({});
        });
    });

    describe('.currentLandingCompany()', () => {
        it('works as expected', () => {
            State.set(['response', 'landing_company'], landing_company);
            Client.set('landing_company_shortcode', 'malta');
            expect(Client.currentLandingCompany()).to.deep.eq({ name: 'Binary (Europe) Ltd', shortcode: 'malta' });
            Client.set('landing_company_shortcode', 'maltainvest');
            expect(Client.currentLandingCompany()).to.deep.eq({ name: 'Binary Investments (Europe) Ltd', shortcode: 'maltainvest' });
            Client.set('landing_company_shortcode', 'virtual');
            expect(Client.currentLandingCompany()).to.deep.eq({});
        });
    });

    describe('.getBasicUpgradeInfo()', () => {
        it('returns false if client can\'t upgrade', () => {
            State.set(['response', 'authorize'], authorize);
            expect(Client.getBasicUpgradeInfo().can_upgrade).to.eq(false);
        });
        it('returns as expected for accounts that can upgrade to real', () => {
            ['malta', 'iom'].forEach((lc) => {
                State.set(['response', 'authorize', 'authorize', 'upgradeable_landing_companies'], [ lc ]);
                State.set(['response', 'landing_company'], valid_landing_company);
                const upgrade_info = Client.getBasicUpgradeInfo();
                expect(upgrade_info.can_upgrade).to.eq(true);
                expect(upgrade_info.can_upgrade_to).to.deep.equal([lc]);
                expect(upgrade_info.type).to.deep.equal(['real']);
                expect(upgrade_info.can_open_multi).to.eq(false);
            });
        });
        it('returns as expected for accounts that can upgrade to financial', () => {
            State.set(['response', 'authorize', 'authorize', 'upgradeable_landing_companies'], [ 'maltainvest' ]);
            State.set(['response', 'landing_company'], valid_landing_company);
            Client.set('loginid', loginid_real, loginid_real);
            const upgrade_info = Client.getBasicUpgradeInfo();
            expect(upgrade_info.can_upgrade).to.eq(true);
            expect(upgrade_info.can_upgrade_to).to.deep.equal(['maltainvest']);
            expect(upgrade_info.type).to.deep.equal(['financial']);
            expect(upgrade_info.can_open_multi).to.eq(false);
        });
    });

    describe('.getLandingCompanyValue()', () => {
        it('works as expected', () => {
            expect(Client.getLandingCompanyValue(loginid_financial, landing_company.landing_company, 'name')).to.eq(landing_company.landing_company.financial_company.name);
            expect(Client.getLandingCompanyValue(loginid_gaming, landing_company.landing_company, 'name')).to.eq(landing_company.landing_company.gaming_company.name);
        });
    });

    describe('.hasSvgAccount()', () => {
        it('works as expected', () => {
            Client.set('loginid', loginid_financial);
            Client.set('token', 'test');
            expect(Client.hasSvgAccount()).to.eq(false);
            Client.set('loginid', loginid_real);
            Client.set('token', 'test');
            expect(Client.hasSvgAccount()).to.eq(true);
        });
    });

    after(() => {
        setURL(`${Url.websiteUrl()}en/home.html`);
        Client.clearAllAccounts();
    });
});
