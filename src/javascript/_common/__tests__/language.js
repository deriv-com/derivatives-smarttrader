const { expect, setURL } = require('./tests_common');
const Language           = require('../language');
const Url                = require('../url');

describe('Language', () => {
    const all_languages = {
        ACH  : 'Translations',
        EN   : 'English',
        DE   : 'Deutsch',
        ES   : 'Español',
        FR   : 'Français',
        IT   : 'Italiano',
        // KO   : '한국어', // TODO: Uncomment when translations are ready
        PL   : 'Polish',
        RU   : 'Русский',
        TH   : 'ไทย',
        VI   : 'Tiếng Việt',
        ZH_CN: '简体中文',
        ZH_TW: '繁體中文',
    };
    const website_url = Url.websiteUrl();

    describe('.getAll()', () => {
        it('works as expected', () => {
            expect(Language.getAll()).to.deep.eq(all_languages);
        });
    });

    describe('.get()', () => {
        it('defaults to EN', () => {
            expect(Language.get()).to.eq('EN');
        });
        it('can detect language from url', () => {
            setURL(`${website_url}home.html?lang=ES`);
            expect(Language.get()).to.eq('ES');
        });
        it('reverts to default language (EN) if invalid url language', () => {
            setURL(`${website_url}home.html?lang=zz`);
            expect(Language.get()).to.eq('EN');
            setURL(`${website_url}home.html`);
        });
    });

});
