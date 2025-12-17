// Mock ESM modules that can't be loaded in CommonJS test environment
const mockRequire = require('mock-require');

// Mock @deriv-com/translations since it's an ESM module
mockRequire('@deriv-com/translations', {
    localize           : (text) => text,
    getAllowedLanguages: () => ({ en: 'English' }),
});

// Configure @babel/register
require('@babel/register')({
    extensions: ['.js', '.jsx'],
});

// Other test setup
require('@babel/polyfill');
require('jsdom-global/register');
require('mock-local-storage');
