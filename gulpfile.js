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
    minify = require('gulp-html-minifier'),
    include = require('gulp-file-include'),
    sass = require('gulp-sass'),
    sequence = require('gulp-sequence'),
    del = require('del'),
    rename = require("gulp-rename"),
    util = require('gulp-util'),
    args = require('yargs').argv;

sass.compiler = require('node-sass');

const config = require('./package.json');

const outputDir = './build',
    buildDirectory = path.join(outputDir, 'theme'),
    emailsDirectory = path.join(outputDir, 'emails'),
    deployDir = config.theme.mauticBasePath ?
        path.join(config.theme.mauticBasePath, 'themes', config.theme.name) : null,
    enableMinifier = config.theme.enableMinifier;

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

gulp.task('build', sequence('clean', 'copy', 'build.sass', 'build.heml', 'build.cleanup'));

gulp.task('deploy', ['build'], () => {
    if (!deployDir) {
        throw Error("Deployment path is not defined. Please set theme.mauticBasePath in your package.json");
    }
    gulp.src(buildDirectory + '/**/*')
        .pipe(gulp.dest(deployDir))
});

gulp.task('package', ['build'], () =>
    gulp.src(buildDirectory + '/*')
        .pipe(zip(config.theme.name + '.zip'))
        .pipe(gulp.dest(outputDir))
);

gulp.task('compile', () => {
    if (!args.email) {
        console.info("Usage: npm run compile -- --email welcome-email");
        throw new Error("Parameter --email is missing.");
    }
    return buildHeml(
        path.join('src', 'heml', 'emails', args.email + '.heml'),
        emailsDirectory
    )
});
