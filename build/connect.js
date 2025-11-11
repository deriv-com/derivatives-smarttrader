const rewrite     = require('connect-modrewrite');
const serveIndex  = require('serve-index');
const serveStatic = require('serve-static');

module.exports = function (grunt) {
    return {
        livereload: {
            options: {
                hostname   : '0.0.0.0',
                port       : 8843,
                protocol   : 'https',
                base       : 'dist',
                open       : {
                    appName: {
                        name: 'Google\ Chrome'
                    },
                    target : 'https://localhost:8843',
                },
                middleware: (connect, options) => {
                    const middlewares = [
                        require('connect-livereload')(),
                    ];

                    const rules = [
                        '^/smarttrader/(.*)$ /$1',
                        '^/app/service-worker\\.js$ - [L]',
                        '^/app/manifest\\.json$ - [L]',
                        '^/app/.*$ /app/ [L]',
                    ];
                    middlewares.push(rewrite(rules));

                    if (!Array.isArray(options.base)) {
                        options.base = [options.base];
                    }

                    options.base.forEach((base) => {
                        middlewares.push(serveStatic(base));
                    });

                    const directory = options.directory || options.base[options.base.length - 1];
                    middlewares.push(serveIndex(directory));

                    // Simple 404 handler without language-based fallbacks
                    middlewares.push((req, res) => {
                        const path_404 = `${options.base[0]}/404.html`;
                        if (grunt.file.exists(path_404)) {
                            require('fs').createReadStream(path_404).pipe(res);
                            return;
                        }
                        res.statusCode = 404;
                        res.end('404 - Page not found');
                    });

                    return middlewares;
                }
            }
        },
    };
};
