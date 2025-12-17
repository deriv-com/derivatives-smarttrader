/**
 * Test Setup - Mock @deriv-com/translations
 *
 * This file is loaded before tests run (configured in build/mochaTest.js).
 * It mocks the @deriv-com/translations package to prevent ES Module import errors
 * during Mocha tests, as the package uses "type": "module" which is not compatible
 * with CommonJS require() used by the test environment.
 *
 * The mock provides simple pass-through implementations of translation functions,
 * allowing tests to run without needing actual translation files.
 */

require('module').Module._cache[require.resolve('@deriv-com/translations')] = {
    id       : require.resolve('@deriv-com/translations'),
    filename : require.resolve('@deriv-com/translations'),
    loaded   : true,
    exports  : {
        localize               : (text) => text, // Simple pass-through for tests
        getAllowedLanguages    : () => ({}),
        getLanguage            : () => 'EN',
        getInitialLanguage     : () => 'EN',
        getURL                 : () => '',
        initializeTranslations : () => Promise.resolve(),
        initializeI18n         : () => ({ changeLanguage: () => Promise.resolve() }),
    },
};
