var debug = require('debug')('gulpfile');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var s3 = require('gulp-s3');
var gzip = require('gulp-gzip');
var uglify = require('gulp-uglify');
var fs = require('fs.extra');

function flattenArray(a, r) {
    if (!r) { r = []; }
    for (var i=0; i<a.length; i++) {
        if (a[i].constructor == Array) {
            flattenArray(a[i], r);
        } else {
            r.push(a[i]);
        }
    }
    return r;
}

gulp.task('check', function() {
    gulp.src('./src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter());
});

gulp.task('build-sched', function() {
    var js = ['./src/schedv.js',
              './src/model.js',
              './src/schedc.js',
             ];
    var html = ['./eg/schedd.html'];
    var lib = './lib/pouchdb-2.1.2.js';
    var target = './dist/sched';

    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(gulp.dest(target + '/dev.html'));
});

gulp.task('build-score', function() {
    var js = ['./src/scorev.js',
              './src/schedv.js',
              './src/model.js',
              './src/scorec.js',
             ];
    var html = ['./eg/scored.html'];
    var lib = ['./lib/pouchdb-2.1.2.js'];
    var target = './dist/score';
    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(gulp.dest(target + '/dev.html'));
});

gulp.task('build-tester', function() {
    var js = [
              './src/model.js',
              './src/tc.js',
             ];
    var html = ['./eg/t.html'];
    var lib = ['./lib/pouchdb-2.1.2.js'];
    var target = './dist/t';
    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(gulp.dest(target + '/index.html'));
});

gulp.task('build', [
    'build-sched',
    'build-score',
    'build-tester']);

gulp.task('publish', ['build',], function() {
    var knox_options = JSON.parse(fs.readFileSync('aws-credentials.json'));
    knox_options.bucket = 'bellinghamultimatescoring-staging';
    knox_options.endpoint = 's3-us-west-2.amazonaws.com';
    gulp.src('./dist/*')
        .pipe(s3(knox_options, {}));
});

gulp.task('clean', function() {
    fs.rmrf('dist', function () {});
});

gulp.task('default', ['check', 'build']);

gulp.task('watch', ['default'], function() {
    gulp.watch(['./dist/*'], ['default']);
});
