var gulp = require('gulp');
var complexity = require('gulp-escomplex');
var reporter = require('gulp-escomplex-reporter-json');
var lab = require('gulp-lab');

var pack = require('./package.json');

gulp.task('complexity', function () {
  return gulp.src([
    'index.js',
    'gulpfile.js'
  ])
  .pipe(complexity({
    packageName: pack.name,
    packageVersion: pack.version
  }))
  .pipe(reporter())
  .pipe(gulp.dest("complexity"));
});

gulp.task('test', function () {
  return gulp.src('./test/**/*.js')
    .pipe(lab({
      args: '-v',
      opts: {
        emitLabError: true
      }
    }));
});

gulp.task('default', [ 'test', 'complexity' ]);
