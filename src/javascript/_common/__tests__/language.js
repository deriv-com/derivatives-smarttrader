const { expect, setURL } = require('./tests_common');
const Language           = require('../language');
const Url                = require('../url');

describe('Language', () => {
    const all_languages = {
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

    describe('.sanitizeStoredLanguage()', () => {
        const xss_payload = '../../../<img src=x onerror=alert(1)>.';

        afterEach(() => {
            setURL(`${website_url}home.html`);
        });

        it('strips an unsupported lang param from the URL', () => {
            setURL(`${website_url}home.html?lang=${encodeURIComponent(xss_payload)}&foo=bar`);
            Language.sanitizeStoredLanguage();
            const params = new URL(window.location.href).searchParams;
            expect(params.has('lang')).to.eq(false);
            expect(params.get('foo')).to.eq('bar');
        });

        it('keeps a supported lang param in the URL', () => {
            setURL(`${website_url}home.html?lang=es`);
            Language.sanitizeStoredLanguage();
            expect(new URL(window.location.href).searchParams.get('lang')).to.eq('es');
        });

        it('removes an unsupported language already saved in localStorage', () => {
            setURL(`${website_url}home.html`);
            localStorage.setItem('i18n_language', JSON.stringify(xss_payload.toUpperCase()));
            Language.sanitizeStoredLanguage();
            expect(localStorage.getItem('i18n_language')).to.eq(null);
        });

        it('removes an unsupported unquoted language saved in localStorage', () => {
            setURL(`${website_url}home.html`);
            localStorage.setItem('i18n_language', '<svg onload=alert(1)>');
            Language.sanitizeStoredLanguage();
            expect(localStorage.getItem('i18n_language')).to.eq(null);
        });

        it('keeps a supported language saved in localStorage', () => {
            setURL(`${website_url}home.html`);
            localStorage.setItem('i18n_language', JSON.stringify('ZH_CN'));
            Language.sanitizeStoredLanguage();
            expect(localStorage.getItem('i18n_language')).to.eq(JSON.stringify('ZH_CN'));
        });
    });

    describe('.isSupported()', () => {
        it('accepts supported languages in any case', () => {
            expect(Language.isSupported('es')).to.eq(true);
            expect(Language.isSupported('ZH_TW')).to.eq(true);
        });
        it('rejects unsupported or non-string values', () => {
            expect(Language.isSupported('en.<img src=x onerror=alert(1)>')).to.eq(false);
            expect(Language.isSupported('zz')).to.eq(false);
            expect(Language.isSupported('')).to.eq(false);
            expect(Language.isSupported(null)).to.eq(false);
            expect(Language.isSupported({})).to.eq(false);
        });
    });

});
