window.$ = window.jQuery = require('jquery');

require('@babel/polyfill');
require('promise-polyfill');
require('./_common/lib/polyfills/nodelist.foreach');
require('./_common/lib/polyfills/element.closest');

require('@binary-com/binary-style');
require('@binary-com/binary-style/binary.more');

// used by gtm to update page after a new release
window.check_new_release = require('./_common/check_new_release').checkNewRelease;

require('event-source-polyfill');
require('./_common/lib/jquery.sparkline.js');
require('./_common/lib/plugins');
require('jquery.scrollto');

const BinaryLoader = require('./app/base/binary_loader');
// Add translation initialization - wait for translations to load before app starts
const { initializeTranslations } = require('./_common/translation-init');

// Wait for DOM and translations before initializing app
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Wait for translations to be fully loaded
        await initializeTranslations();
        // eslint-disable-next-line no-console
        console.log('Translations loaded, initializing SmartTrader');
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Translation initialization failed, continuing with fallback:', error);
    }
    
    // Initialize SmartTrader after translations are ready
    BinaryLoader.init();
});
window.onpageshow = function(event) {
    if (event.persisted) {
        window.location.reload();
    }
};
