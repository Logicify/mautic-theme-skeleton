/*
 * Copyright 2018 Dmitry Berezovsky, Logicify
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
 * associated documentation files (the "Software"), to deal in the Software without restriction, including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
 * BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

const gulp = require('gulp'),
    zip = require('gulp-zip'),
    path = require('path'),
    heml = require('gulp-heml'),
    clean = require('gulp-clean'),
    minify = require('gulp-html-minifier2'),
    include = require('gulp-file-include'),
    sass = require('gulp-sass'),
    sequence = require('gulp-sequence'),
    del = require('del'),
    rename = require("gulp-rename"),
    util = require('gulp-util'),
    fs = require('fs-extra'),
    es = require('event-stream'),
    args = require('yargs').argv;

sass.compiler = require('node-sass');

const config = require('./package.json');

const outputDir = './build',
    buildDirectory = path.join(outputDir, 'out'),
    themesDirectory = path.join(outputDir, 'themes'),
    emailsDirectory = path.join(outputDir, 'emails'),
    deployDir = config.mautic.mauticBasePath ?
        path.join(config.mautic.mauticBasePath, 'themes') : null,
    enableMinifier = config.mautic.enableMinifier;

function buildHeml(input, output) {
    return gulp.src(input)
        .pipe(include({
            prefix: '@'
        }))
        .pipe(heml({
            validate: 'soft', // validation levels - 'strict'|'soft'|'none'
            cheerio: {}, // config passed to cheerio parser
            juice: {},
            beautify: {}, // config passed to js-beautify html method
            elements: [
                // any custom elements you want to use
            ]
        }))
        .pipe(!enableMinifier ? util.noop() :
            minify({
                conservativeCollapse: true,
                collapseWhitespace: true,
                collapseInlineTagWhitespace: true,
                minifyCSS: true,
                removeTagWhitespace: true
            }))
        .pipe(rename((path) => {
            path.basename = path.basename.replace('.heml', '.html');
            path.extname = '.twig';
        }))
        .pipe(gulp.dest(output));
}

gulp.task('build.bundles', () => {
    for (let i = 0; i < config.mautic.themes.length; i++) {
        const themePath = path.join(themesDirectory, config.mautic.themes[i].name);
        const themeTemplateName = config.mautic.themes[i].emailTemplateFile.replace('.heml.', '.html.');
        const manifestLocation = path.join(themePath, 'config.json');
        let mainEmailThemeFile = null;
        fs.copySync(buildDirectory, themePath, {
            filter: (src, dest) => {
                const fileName = path.basename(dest);
                if (fileName.startsWith('email') && fileName.endsWith('.html.twig')) {
                    if (fileName === themeTemplateName) {
                        mainEmailThemeFile = dest;
                    }
                    return fileName === themeTemplateName;
                } else {
                    return true;
                }
            }
        });
        // Rename main e-mail theme file to match Mautic convention
        if (mainEmailThemeFile) {
            fs.moveSync(mainEmailThemeFile, path.join(path.dirname(mainEmailThemeFile), 'email.html.twig'));
        } else {
            throw new Error('Can\'t locate main email template file for theme ' + config.mautic.themes[i].name
                + '. Check your property' + ' mautic.themes[].emailTemplateFile in package.json');
        }
        // Update Mautic theme manifest
        const manifest = fs.readJsonSync(manifestLocation, {throws: false});
        if (!manifest) {
            throw new Error('Missing or invalid Mautic theme manifest file. Check your src/config.json');
        }
        manifest.name = config.mautic.themes[i].verboseName;
        fs.writeJSONSync(manifestLocation, manifest, {spaces: 2});
    }
    return del([buildDirectory]);
});

gulp.task('build.heml', () =>
    buildHeml(buildDirectory + '/heml/*.heml.twig', buildDirectory + '/html')
);

gulp.task('clean', () =>
    gulp.src(outputDir, {read: false})
        .pipe(clean())
);

gulp.task('copy', () =>
    gulp.src('./src/**/*')
        .pipe(gulp.dest(buildDirectory))
);

gulp.task('build.cleanup', () =>
    del([
        path.join(buildDirectory, 'heml'),
        path.join(buildDirectory, 'assets', '**', '*.scss'),
        path.join(buildDirectory, 'assets', '**', '*.css')
    ])
);

gulp.task('build.sass', () =>
    gulp.src(path.join(buildDirectory, 'assets', '/**/*.scss'))
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(path.join(buildDirectory, 'assets')))
);

gulp.task('build', (cb) => sequence('clean', 'copy', 'build.sass', 'build.heml', 'build.cleanup', 'build.bundles')(cb));

gulp.task('deploy', ['build'], () => {
    if (!deployDir) {
        throw Error("Deployment path is not defined. Please set theme.mauticBasePath in your package.json");
    }
    gulp.src(themesDirectory + '/**/*')
        .pipe(gulp.dest(deployDir))
});

gulp.task('package', ['build'], (cb) => {
    const themes = fs.readdirSync(themesDirectory);
    let zipTasks = [];
    for (let i = 0; i < themes.length; i++) {
        zipTasks.push(
            gulp.src(path.join(themesDirectory, themes[i]) + '/*')
                .pipe(zip(themes[i] + '.zip'))
                .pipe(gulp.dest(outputDir))
        );
    }
    es.concat(zipTasks).on('end', cb);
});

gulp.task('compile', () => {
    if (!args.email) {
        console.info("Usage: npm run compile -- --email welcome-email");
        throw new Error("Parameter --email is missing.");
    }
    return buildHeml(
        path.join('src', 'heml', 'emails', args.email + '.heml'),
        emailsDirectory
    );
});

gulp.task('watch', () =>
    gulp.watch([
        '!./src/heml/emails/**/*',
        '!./src/**/*___jb_tmp___',
        './src/**/*.twig',
        './src/assets/**/*'
    ],['deploy'])
);
