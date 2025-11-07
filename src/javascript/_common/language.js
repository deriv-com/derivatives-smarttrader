const Cookies            = require('js-cookie');
const elementTextContent = require('./common_functions').elementTextContent;
const getElementById     = require('./common_functions').getElementById;
const CookieStorage      = require('./storage').CookieStorage;
const LocalStore         = require('./storage').LocalStore;
const applyToAllElements = require('./utility').applyToAllElements;

const Language = (() => {
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
    const default_language = 'EN';
    let is_language_changing = false;

    const setCookieLanguage = (lang) => {
        if (!Cookies.get('language') || lang) {
            const cookie = new CookieStorage('language');
            cookie.write((lang || getLanguage()).toUpperCase(), undefined, true, 'none');
        }
    };

    const languageFromUrl = () => {
        // Check for lang parameter, save if valid, and always clean URL
        try {
            const url = new URL(window.location.href);
            const langParam = url.searchParams.get('lang');
            
            if (langParam) {
                // Save to localStorage only if language is supported
                if (Object.keys(all_languages).includes(langParam.toUpperCase())) {
                    localStorage.setItem('i18n_language', JSON.stringify(langParam.toUpperCase()));
                }
                
                // Clean lang parameter from URL
                url.searchParams.delete('lang');
                window.history.replaceState({}, '', url.toString());
            }
            
            return null; // Always return null - we only use localStorage
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error processing URL language parameter:', error);
            return null;
        }
    };

    let current_lang = null;

    // Crowdin integration (maintain existing functionality)
    const getCrowdinLanguage = () => {
        if (!/ach/i.test(window.location.href)) return null;
        
        const crowdin_lang_key = 'jipt_language_code_dsmarttrader';
        const crowdin_lang = localStorage.getItem(crowdin_lang_key) ||
                           Cookies.get(crowdin_lang_key);
        
        if (crowdin_lang) {
            return crowdin_lang.toUpperCase().replace('-', '_');
        }
        return null;
    };

    const getLanguage = () => {
        // Handle Crowdin override
        const crowdinLang = getCrowdinLanguage();
        if (crowdinLang) {
            current_lang = crowdinLang;
            if (document.body) {
                document.body.classList.add(current_lang); // set the body class removed by crowdin code
            }
            return current_lang;
        }
        
        // Process URL parameter first (saves to localStorage and cleans URL)
        languageFromUrl();
        
        // Language detection based only on localStorage
        let storedLang = localStorage.getItem('i18n_language');
        
        if (storedLang) {
            // Parse JSON-stringified value from @deriv-com/translations
            try {
                storedLang = JSON.parse(storedLang);
            } catch (e) {
                // If not JSON, use as-is for backward compatibility
            }
            
            if (Object.keys(all_languages).includes(storedLang.toUpperCase())) {
                current_lang = storedLang.toUpperCase();
                return current_lang;
            }
        }
        
        // Default language if nothing in localStorage
        current_lang = default_language;
        return current_lang;
    };

    const getAllowedLanguages = () => Object.keys(all_languages).filter(lang =>
        !['ACH'].includes(lang) // Exclude Crowdin pseudo-language
    );

    const changeSelectedLanguage = async (language_key) => {
        if (is_language_changing) return;
        if (language_key === getLanguage()) return;
        
        const allowed_languages = getAllowedLanguages();
        if (!allowed_languages.includes(language_key)) {
            // eslint-disable-next-line no-console
            console.warn('Unsupported language:', language_key);
            return;
        }
        
        is_language_changing = true;
        
        try {
            // Update local storage
            localStorage.setItem('i18n_language', JSON.stringify(language_key.toUpperCase()));
            
            // Update cookies for server-side compatibility
            setCookieLanguage(language_key);
            
            // Update moment locale
            if (window.moment) {
                const momentLocale = language_key.toLowerCase().replace('_', '-');
                window.moment.locale(momentLocale);
            }
            
            // Update document language
            document.documentElement.lang = language_key.toLowerCase();
            
            // Clear cache
            LocalStore.remove('ws_cache');
            
            // Reload page to apply language change (URL will be clean)
            window.location.reload();
            
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Language change failed:', error);
        } finally {
            is_language_changing = false;
        }
    };

    const onChangeLanguage = () => {
        applyToAllElements('li', (el) => {
            el.addEventListener('click', async (e) => {
                if (e.target.nodeName !== 'LI') return;
                const lang = e.target.getAttribute('class');
                if (getLanguage() === lang) return;
                
                elementTextContent(getElementById('display_language').getElementsByClassName('language'), e.target.textContent);
                
                // Use new language change system
                await changeSelectedLanguage(lang);
            });
        }, '', getElementById('select_language'));
    };

    return {
        getAll    : () => all_languages,
        getAllowedLanguages,
        setCookie : setCookieLanguage,
        get       : getLanguage,
        onChange  : onChangeLanguage,
        changeSelectedLanguage,
        isChanging: () => is_language_changing,
        reset     : () => { current_lang = null; is_language_changing = false; },
    };
})();

module.exports = Language;
