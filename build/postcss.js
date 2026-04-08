const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const fs = require('fs');
const path = require('path');

// Simple cachebuster plugin for postcss 8
// Replaces postcss-cachebuster which only supports postcss 5
const cachebuster = () => {
    const supportedProps = ['background', 'background-image'];
    return {
        postcssPlugin: 'postcss-cachebuster-inline',
        Declaration(decl) {
            if (!supportedProps.includes(decl.prop)) return;
            const urlRegex = /url\((['"]?)([^)'"]+)\1\)/g;
            let changed = false;
            const newValue = decl.value.replace(urlRegex, (match, quote, filePath) => {
                if (filePath.startsWith('data:') || filePath.startsWith('http') || filePath.includes('?')) {
                    return match;
                }
                const resolvedPath = path.resolve(global.dist, 'css', filePath);
                try {
                    const stat = fs.statSync(resolvedPath);
                    const timestamp = stat.mtime.getTime();
                    changed = true;
                    return `url(${quote}${filePath}?${timestamp}${quote})`;
                } catch (e) {
                    return match;
                }
            });
            if (changed) {
                decl.value = newValue;
            }
        },
    };
};
cachebuster.postcss = true;

module.exports = function (grunt) {
    grunt.registerTask('postcss', 'Process CSS with PostCSS (autoprefixer + cachebuster)', function () {
        const done = this.async();
        const pattern = `${global.dist}/css/{app,common,static,reset}.css`;
        const files = grunt.file.expand(pattern);

        if (!files.length) {
            grunt.log.warn('No CSS files found matching: ' + pattern);
            done();
            return;
        }

        const processor = postcss([autoprefixer(), cachebuster()]);

        Promise.all(files.map(file => {
            const css = fs.readFileSync(file, 'utf8');
            return processor.process(css, { from: file, to: file }).then(result => {
                fs.writeFileSync(file, result.css);
                if (result.map) {
                    fs.writeFileSync(file + '.map', result.map.toString());
                }
                grunt.log.ok('Processed: ' + file);
            });
        }))
            .then(() => done())
            .catch(err => {
                grunt.log.error(err);
                done(false);
            });
    });
};
