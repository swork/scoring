var debug = require('debug')('gulpfile');
var gulp = require('gulp');
var gutil = require('gulp-util');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var s3 = require('gulp-s3');
var gzip = require('gulp-gzip');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var request = require('request');
var fs = require('fs.extra');

var couch_db = 'http://fun.renlabs.com:5984/bu';

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
    var html = ['./src/schedd.html'];
    var lib = './lib/pouchdb-2.1.2.js';
    var target = './dist/sched';

    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(rename('dev.html'))
        .pipe(gulp.dest(target));
});

gulp.task('build-score', function() {
    var js = ['./src/scorev.js',
              './src/schedv.js',
              './src/model.js',
              './src/scorec.js',
             ];
    var html = ['./src/scored.html'];
    var lib = ['./lib/pouchdb-2.1.2.js'];
    var target = './dist/score';
    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(rename('dev.html'))
        .pipe(gulp.dest(target));
});

gulp.task('build-tester', function() {
    var js = [
              './src/model.js',
              './src/tc.js',
             ];
    var html = ['./src/t.html'];
    var lib = ['./lib/pouchdb-2.1.2.js'];
    var target = './dist/t';
    gulp.src(flattenArray([js, lib]))
        .pipe(gulp.dest(target));
    gulp.src(html)
        .pipe(rename('index.html'))
        .pipe(gulp.dest(target));
});

gulp.task('build', [ 'build-sched', 'build-score', 'build-tester']);

gulp.task('clean', function() {
    fs.rmrf('dist', function () {});
});

gulp.task('default', ['check', 'build']);

gulp.task('watch', ['default'], function() {
    gulp.watch(['./dist/*'], ['default']);
});

////////////////////////////////////////////////////////////////

function couch_attach_doc(url, distdir, rev, doclist) {
    var docfile = doclist.pop();
    var attachment_url = url + '/' + docfile + "?rev=" + rev;
    fs.createReadStream(distdir + '/' + docfile)
        .pipe(request.put(attachment_url, function(e, r, b) {
            if (!e && r.statusCode == 201) {
                if (doclist.length > 0) {
                    var rev = JSON.parse(b).rev;
                    couch_attach_doc(url, distdir, rev, doclist);
                }
            } else {
                console.log("Trouble attaching ", docfile, e, r.statusCode, b);
            }
        }));
}

function couch_attach_docs(appname, doclist) {
    var distdir = './dist/' + appname;
    var srcdoc = './src/' + appname + '.json';
    var url = couch_db + '/' + appname;
    request.head(url, function (err, resp, body) {
        if (!err && resp.statusCode == 404) {
            fs.createReadStream(srcdoc)
                .pipe(request.put(url, function(e, r, b) {
                    if (!e && (r.statusCode == 201 || r.statusCode == 200)) {
                        couch_attach_docs(appname, doclist);
                    } else {
                        console.log("Trouble creating ", srcdoc, e, r.statusCode, b);
                    }
                }));
        } else if (!err && resp.statusCode == 200) {
            var rev = JSON.parse(resp.headers.etag);  /* lose "" */
            couch_attach_doc(url, distdir, rev, doclist);
        } else {
            console.log('code:', resp && resp.statusCode, 'err:', err, ' url:', url);
        }
    });
}

gulp.task('publish', ['build',], function() {
    request.head(couch_db, function (e, r, b) { if (!e && r.statusCode == 404) { console.log("Create database "+couch_db+" first.");}});
    couch_attach_docs('score', ['dev.html','model.js','pouchdb-2.1.2.js','schedv.js','scorec.js','scorev.js']);
    couch_attach_docs('sched', ['dev.html','model.js','pouchdb-2.1.2.js','schedv.js','schedc.js']);
    couch_attach_docs('t', ['index.html','model.js','pouchdb-2.1.2.js','tc.js']);
});
