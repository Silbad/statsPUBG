'use strict';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    rename = require('gulp-rename'),
    cleanCSS = require('gulp-clean-css'),
    clean = require('gulp-clean'),
    syncy = require('syncy')

var paths = {
    sass_files: {
        src: './scss/*.scss',
        dest: './css/'
    },
    css_files: {
        src: './css/*.css',
        dest: './app/'
    },
    js_files: {
        src: './js/*.js',
        dest: './js/'
    }
}

function cleanCss() {
    return gulp.src(paths.css_files.src)
        .pipe(clean({force: true}));
}

function styles() {
    return gulp.src(paths.sass_files.src, {
        sourcemaps: true
    })
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest(paths.sass_files.dest))
    .on('end', function () {
        return gulp.src(paths.css_files.src)
            .pipe(cleanCSS())
            .pipe(rename({
                suffix: '.min'
            }))
            .pipe(gulp.dest(paths.css_files.dest));
    });
}

function getNodeFiles() {
    return syncy(['node_modules/popper.js/dist/umd/*popper.min.js'], 'js/', {
        verbose: true,
        updateAndDelete: false,
        base: 'node_modules/popper.js/dist/umd/'
    }).then(
        syncy(['node_modules/jquery/dist/*jquery.min.js'], 'js/', {
            verbose: true,
            updateAndDelete: false,
            base: 'node_modules/jquery/dist/'
        }).then(
            syncy(['node_modules/bootstrap/dist/js/*bootstrap.min.js'], 'js/', {
                verbose: true,
                updateAndDelete: false,
                base: 'node_modules/bootstrap/dist/js/'
            }).then(
                syncy(['node_modules/pubg-api-wrapper/build/*index.js'], 'js/', {
                    verbose: true,
                    updateAndDelete: false,
                    base: 'node_modules/pubg-api-wrapper/build/'
                }).then(
                    syncy(['node_modules/font-awesome/fonts/**'], 'fonts/', {
                        verbose: true,
                        updateAndDelete: false,
                        base: 'node_modules/font-awesome/fonts/'
                    })
                )
            )
        )
    )
}

function watch() {
    gulp.watch(paths.sass_files.src, gulp.series(cleanCss, styles));
}

var build = gulp.parallel(gulp.series(getNodeFiles, cleanCss, styles), watch);

gulp.task(build);
gulp.task('default', build);
