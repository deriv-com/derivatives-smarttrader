// Translation initialization for SmartTrader's existing architecture
const { getInitialLanguage, initializeI18n } = require('@deriv-com/translations');

let i18nInstance = null;
let isInitialized = false;

const initializeTranslations = async () => {
    if (isInitialized) return i18nInstance;
    
    try {
        // Initialize i18n instance with CDN configuration
        i18nInstance = initializeI18n({
            cdnUrl: `${process.env.CROWDIN_URL}/${process.env.R2_PROJECT_NAME}/${process.env.CROWDIN_BRANCH_NAME}`,
        });

        // Get initial language
        const language = getInitialLanguage();

        // Set document language attribute
        document.documentElement.lang = language.toLowerCase();
        
        // Update moment locale if available
        if (window.moment) {
            const momentLocale = language.toLowerCase().replace('_', '-');
            window.moment.locale(momentLocale);
        }

        // Make translations globally available for existing SmartTrader code
        window.derivTranslations = {
            i18nInstance,
            language,
            getInitialLanguage,
        };

        isInitialized = true;
        // eslint-disable-next-line no-console
        console.log('SmartTrader translations initialized successfully');
        return i18nInstance;
        
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to initialize SmartTrader translations:', error);
        isInitialized = true; // Prevent retry loops
        return null;
    }
};

const getI18nInstance = () => i18nInstance;
const isTranslationsInitialized = () => isInitialized;

module.exports = {
    initializeTranslations,
    getI18nInstance,
    isTranslationsInitialized,
};
