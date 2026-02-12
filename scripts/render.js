#!/usr/bin/env node

/* eslint-disable no-console, no-underscore-dangle */

/**
 * Mock @deriv-com/translations for Server-Side Rendering
 *
 * This mock is required because @deriv-com/translations is an ES Module
 * ("type": "module" in package.json) which cannot be loaded via CommonJS require()
 * during the template compilation process.
 *
 * This mock only affects server-side template rendering (build time).
 * The browser runtime uses the real @deriv-com/translations package bundled by webpack,
 * so all translation features and language switching work normally in the browser.
 */
require('module').Module._cache[require.resolve('@deriv-com/translations')] = {
    id      : require.resolve('@deriv-com/translations'),
    filename: require.resolve('@deriv-com/translations'),
    loaded  : true,
    exports : {
        localize              : (text) => text, // Simple pass-through for server-side rendering
        getAllowedLanguages   : () => ({}),
        getLanguage           : () => 'EN',
        getInitialLanguage    : () => 'EN',
        getURL                : () => '',
        initializeTranslations: () => {},
    },
};
require('@babel/register')({
    plugins: [
        '@babel/plugin-transform-modules-commonjs',
        '@babel/plugin-transform-react-jsx',
    ],
    extensions: ['.jsx'],
    cache     : true,
});

const React          = require('react');
const ReactDOMServer = require('../node_modules/react-dom/server.js'); // eslint-disable-line import/order

// Simple HTML renderer for server-side rendering
const renderHTML = (html) => {
    if (typeof html === 'string') {
        return html;
    }
    return html;
};

const renderComponent = (context, path) => {
    const Component = require(path).default; // eslint-disable-line

    global.it = context;
    return ReactDOMServer.renderToStaticMarkup(
        React.createElement(
            Component
        )
    );
};

const color          = require('cli-color');
const Spinner        = require('cli-spinner').Spinner;
const program        = require('commander');
const Crypto         = require('crypto');
const fs             = require('fs');
const Path           = require('path');
const Url            = require('url');
const common         = require('./common');

program
    .version('0.2.2')
    .description('Build .jsx templates into /dist folder')
    .option('-d, --dev',                 'Build for your gh-pages')
    .option('-b, --branch [branchname]', 'Build your changes to a sub-folder named: branchname')
    .option('-p, --path [save_as]',      'Compile only the template(s) that match the regex save_as')
    .option('-v, --verbose',             'Displays the list of paths to be compiled')
    .parse(process.argv);

/** *********************************************
 * Common functions
 */

const getConfig = () => (
    {
        add_translations: false,
        branch          : program.branch,
        dist_path       : Path.join(common.root_path, 'dist', (program.branch || '')),
        languages       : program.branch === 'translations' ? ['ACH'] : common.languages,
        root_path       : common.root_path,
        root_url        : `/${program.branch && !fs.existsSync(Path.join(common.root_path, 'scripts', 'CNAME')) ? 'binary-static/' : ''}${program.branch ? `${program.branch}/` : ''}`,
    }
);

const createDirectories = (section, idx) => {
    const config = getConfig();
    const base_path = Path.join(config.dist_path, common.sections_config[section || ''].path);

    if (idx === 0) { // display once only
        console.log(color.cyan('Target:'), color.yellow(config.dist_path));
    }

    const mkdir = path => fs.existsSync(path) || fs.mkdirSync(path);
    mkdir(config.dist_path);
    mkdir(base_path);

    // Create root directory structure without language subdirectories
    if (common.sections_config[section || ''].has_pjax) {
        mkdir(Path.join(base_path, 'pjax'));
    }
};

const fileHash = (path) => (
    new Promise((resolve) => {
        const fd   = fs.createReadStream(path);
        const hash = Crypto.createHash('sha1');
        hash.setEncoding('hex');

        fd.on('end', () => {
            hash.end();
            resolve(hash.read());
        });

        fd.pipe(hash);
    })
);

/** **************************************
 * Factory functions
 */

// Removed translator - translations now handled at runtime by @deriv-com/translations
const createTranslator = () => (text, ...args) => {
    // Return a pass-through function that just replaces placeholders
    let result = text;
    for (let i = 0; i < args.length; i++) {
        result = result.replace(`[_${i + 1}]`, args[i]);
    }
    return result;
};

const createUrlFinder = (default_lang, section_path, root_url = getConfig().root_url) => (
    (url, lang, section) => { // use section to create url for a different section. If missing, uses the current pages's section as default
        const section_final_path = typeof section !== 'undefined' ? common.sections_config[section === 'app' ? '' : section].path : section_path;

        let new_url = url;
        if (new_url === '' || new_url === '/') {
            new_url = '/trading';
        }

        if /(^\/?(images|js|css|scripts|download))|(manifest\.json)/.test(new_url)) {
            return Path.join(root_url, section_final_path, new_url);
        }

        const url_object = Url.parse(new_url, true);
        const pathname   = Path.join(url_object.pathname.replace(/^\//, '')); // convert a/b/../c to a/c

        if (common.pages.filter(page => page.save_as === pathname).length) {
            url_object.pathname = Path.join(root_url, section_final_path, `${pathname}.html`);
            return Url.format(url_object);
        }

        throw new TypeError(`Invalid url ${new_url}`);
    }
);

const generateJSFilesList = async (config, section, section_static_hash) => Promise.all(
    common.sections_config[section].js_files
        .map(js => Path.join(common.sections_config[section].path, 'js', `${js}${program.dev && js === 'binary' ? '' : '.min'}.js`))
        .map(async js =>
            `${config.root_url}${js}?${/binary/.test(js) ? section_static_hash : await fileHash(Path.join(config.dist_path, js))}`
        )
);

const generateCSSFilesList = (config, sections, static_hash) => (
    sections.reduce((acc, section) => ({
        ...acc,
        [section]: common.sections_config[section].css_files
            .map(css => Path.join(config.root_url, common.sections_config[section].path, 'css', `${css}.css?${static_hash[section]}`)),
    }), {})
);

const createContextBuilder = async (sections) => {
    const config = getConfig();

    const static_hash   = {};
    const js_files_list = {};

    await Promise.all(sections.map(async section => {
        // create new hash for each section or use an existing one if there is any
        static_hash[section] = Math.random().toString(36).substring(2, 10);
        const version_path = Path.join(config.dist_path, common.sections_config[section].path, 'version');
        if (program.path) {
            try {
                static_hash[section] = await common.readFile(version_path);
            } catch (e) { } // eslint-disable-line
        }

        await common.writeFile(version_path, static_hash[section], 'utf8');

        // prepare js files list for all applicable sections
        js_files_list[section] = await generateJSFilesList(config, section, static_hash[section]);
    }));

    // prepare css files list for all applicable sections
    const css_files_list = generateCSSFilesList(config, sections, static_hash);

    const extra = section => ({
        js_files   : [...js_files_list[section]],
        css_files  : css_files_list[section],
        languages  : config.languages,
        broker_name: 'Deriv',
        static_hash: static_hash[section],
    });

    return {
        buildFor: (model) => {
            const translator = createTranslator(model.language);
            return Object.assign({}, extra(model.section), model, {
                L: (text, ...args) => {
                    const translated = translator(text, ...args);
                    return renderHTML(translated);
                },
                url_for              : createUrlFinder(model.language, common.sections_config[model.section].path),
                dangreouslyRenderHtml: renderHTML,
                derivDomainName      : () => window.location.hostname.split('.').splice(1).join('.') || 'deriv.com',
            });
        },
    };
};

const getFilePath = (save_path_template, language, is_pjax) => (
    save_path_template.replace('/LANG_PLACEHOLDER', `${is_pjax ? '/pjax' : ''}`)
);

/** **********************************************
 * Compile
 */
let context_builder;
async function compile(page) {
    const config              = getConfig();
    const languages           = ['EN'];
    const CONTENT_PLACEHOLDER = 'CONTENT_PLACEHOLDER'; // used in layout.jsx
    const section_path        = common.sections_config[page.section].path;
    const save_path_template  = Path.join(config.dist_path, section_path, 'LANG_PLACEHOLDER', `${page.save_as}.html`);

    const tasks = languages.map(async lang => {
        const affiliate_language_code = common.getAffiliateSignupLanguage(lang);
        const deriv_language_code = lang === 'EN' ? '' : `${lang.toLowerCase().replace(/_/g, '-')}/`;
        const model = {
            website_name   : 'Deriv',
            title          : page.title,
            layout         : page.layout,
            language       : lang.toUpperCase(),
            root_url       : config.root_url,
            section        : page.section,
            current_path   : page.save_as,
            current_route  : page.current_route,
            is_pjax_request: false,

            affiliate_signup_url  : `https://login.binary.com/signup.php?lang=${affiliate_language_code}`,
            affiliate_password_url: `https://login.binary.com/password-reset.php?lang=${affiliate_language_code}`,
            deriv_app_url         : `https://app.deriv.com/${deriv_language_code}`,
            p2p_redirect_url      : `https://app.deriv.com/cashier/p2p`,
            // Fixed regex injection vulnerability - properly escape dynamic input
            path_regex_filter     : program.path ? new RegExp(program.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : null,
        };

        if (!context_builder) {
            context_builder = await createContextBuilder([page.section]);
        }

        const context = context_builder.buildFor(model);
        
        let html;
        try {
            html = renderComponent(context, Path.join(common.root_path, 'src', 'templates', page.layout));
        } catch (error) {
            console.error(`Error rendering ${page.save_as}:`, error);
            return null;
        }

        if (!html) return null;

        if (page.layout && page.layout !== 'layout/layout.jsx') {
            const layout_model = Object.assign({}, model, {
                title              : page.title,
                content            : html,
                is_full_width      : page.is_full_width,
                social_sharing     : !!page.social_sharing,
                exclude_pusher     : page.exclude_pusher,
                exclude_all_scripts: page.exclude_all_scripts,
            });

            const layout_context = context_builder.buildFor(layout_model);
            const layout_html    = renderComponent(layout_context, Path.join(common.root_path, 'src', 'templates', 'layout/layout.jsx'));
            html = layout_html.replace(CONTENT_PLACEHOLDER, html);
        }

        const file_path = getFilePath(save_path_template, lang, false);
        await common.writeFile(file_path, html);

        if (common.sections_config[page.section].has_pjax) {
            const pjax_file_path = getFilePath(save_path_template, lang, true);
            await common.writeFile(pjax_file_path, html);
        }

        return file_path;
    });

    return Promise.all(tasks);
}

/** ************************************
 * Main build execution
 */
(async () => {
    const pages = common.pages.filter(page => !program.path || new RegExp(program.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(page.save_as));
    
    if (program.verbose) {
        console.log(`Compiling ${pages.length} pages...`);
        pages.forEach(page => console.log(` - ${page.save_as}`));
    }

    const sections = [...new Set(pages.map(page => page.section))];
    sections.forEach(createDirectories);

    const spinner = new Spinner('Building... %s');
    spinner.setSpinnerString('|/-\\');
    spinner.start();

    let compiled_count = 0;
    const compile_promises = pages.map(async (page) => {
        try {
            await compile(page);
            compiled_count++;
            if (program.verbose) {
                console.log(`Compiled: ${page.save_as}`);
            }
        } catch (error) {
            console.error(`Failed to compile ${page.save_as}:`, error);
        }
    });

    await Promise.all(compile_promises);
    
    spinner.stop();
    console.log(`\nCompleted compilation of ${compiled_count} pages.`);
})();