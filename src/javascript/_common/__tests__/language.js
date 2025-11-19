const { expect, setURL } = require('./tests_common');
const Language           = require('../language');
const Url                = require('../url');

describe('Language', () => {
    const all_languages = {
        ACH  : 'Translations',
        EN   : 'English',
        // AR   : 'العربية',
        BN   : 'বাংলা',
        DE   : 'Deutsch',
        ES   : 'Español',
        FR   : 'Français',
        // ID   : 'Indonesian',
        IT   : 'Italiano',
        SW   : 'Kiswahili',
        TA   : 'தமிழ்',
        // KM   : 'ខ្មែរ',
        KO   : '한국어',
        MN   : 'Монгол',
        PL   : 'Polish',
        PT   : 'Português',
        RU   : 'Русский',
        SI   : 'සිංහල',
        // TH   : 'ไทย',
        // TR   : 'Türkçe',
        // UZ   : 'O\'zbek',
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
