var debug = require('debug')('gulpfile');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var s3 = require('gulp-s3');
var gzip = require('gulp-gzip');
var uglify = require('gulp-uglify');
var fs = require('fs.extra');

var filesets = {
    schedule_js: [
        './src/poolplay.js',
        './src/model.js',
        './src/app.js',
        './pkg/*.js'
    ],
    scorekeep_js: [
        './src/poolplay.js',  // eventually goes away - scoring is standalone, start via email link
        './src/scoring.js',
        './src/model.js',
        './src/app-scoring.js',
        './pkg/*.js'
    ],
};

gulp.task('check', function() {
    gulp.src(filesets.scorekeep_js) // better filesets needed, schedule_js
        .pipe(jshint())
        .pipe(jshint.reporter());
});

gulp.task('build-staging', function() {
    gulp.src(filesets.scorekeep_js)
        .pipe(concat('scorekeep.js'))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gzip({ append: false }))
        .pipe(gulp.dest('./staging/'));
    gulp.src(filesets.schedule_js)
        .pipe(concat('schedule.js'))
        .pipe(uglify({outSourceMap: true}))
        .pipe(gzip({ append: false }))
        .pipe(gulp.dest('./staging/'));
});

gulp.task('build', function() {
    gulp.src(filesets.scorekeep_js)
        .pipe(gulp.dest('./dist/'));
    gulp.src(filesets.schedule_js)
        .pipe(gulp.dest('./dist/'));
});

gulp.task('publish', ['build-staging',], function() {
    var knox_options = JSON.parse(fs.readFileSync('aws-credentials.json'));
    knox_options.bucket = 'bellinghamultimatescoring-staging';
    knox_options.endpoint = 's3-us-west-2.amazonaws.com';

    var params = {
        headers: { "Content-Encoding": "gzip",
                   "Content-Type": "application/javascript",
                   "X-Steve-Was-Here": "yup" }
    };

    gulp.src('./staging/*.js')
        .pipe(s3(knox_options, params));
    gulp.src('./staging/*.map')
        .pipe(s3(knox_options, params));
});

gulp.task('clean', function() {
    fs.rmrf('dist', function () {});
    fs.rmrf('staging', function () {});
});

gulp.task('default', ['check', 'build']);
