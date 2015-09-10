/**
 * TODO:
 *  - Concatenate static assets
 *  - Minify and obfuscate static assets (CSS/JS)
 *  - Compress images
 *  - Cache build assets (only update certain files)
 *  - Add a clean build task
 *  - Monitor removed files and strip from production.
 *  - Setup remote deployment (production)
 */
var gulp = require('gulp'),
    // livereload = require('gulp-livereload'),
    // sass = require('gulp-sass'),
    // notify = require("gulp-notify"),
    // gulpif = require('gulp-if'),
    // jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    // imagemin = require('gulp-imagemin'),
    cache = require('gulp-cache'),
    // shell = require('gulp-shell'),
    // ignore = require('gulp-ignore'),
    del = require('del'),
    fs = require('fs'),
    path = require('path')
    pkg = require('package.json')
    // exec = require('child_process').exec

var DIR = {
  source: path.resolve('./src'),
  dist: path.resolve('./dist')
};

// Build a release
gulp.task('build', ['clean','copy']);

// Create a clean build
gulp.task('clean', function(next){
  console.log('Cleaning distribution.');
  if (fs.existsSync(DIR.dist)){
    del.sync(DIR.dist);
  }
  fs.mkdirSync(DIR.dist);
  next();
});

gulp.task('copy', function(){
  console.log('Copying distribution files to ',DIR.dist);
  var files = ['dom','bus','reference','http','svg'];
  var sources = files.map(function (file) {
    return path.join(DIR.source,file+'.js');
  });

  // Copy individual files
  gulp.src(sources, {
    base: DIR.source
  }).pipe(gulp.dest(DIR.dist));

  // Minify each individual file
  sources.forEach(function (file,index) {
    gulp.src(file)
    .pipe(concat(files[index]+'.min.js'))
    .pipe(gulp.dest(DIR.dist));
  });

  // Generate full project
  gulp.src(sources)
  .pipe(concat('chassis.js'))
  .pipe(gulp.dest(DIR.dist));

  return gulp.src(sources)
  .pipe(concat('chassis.min.js'))
  .pipe(uglify({
    mangle: true
  }))
  .pipe(gulp.dest(DIR.dist));
  // return gulp.src([
  //   DIR.source+'/**/*'
  // ], {
  //   base: DIR.source
  // }).pipe(gulp.dest(DIR.dist));
});

gulp.task('optimize', function(){
  return gulp.src(path.join(DIR.dist,'chassis.min.js'))
  .pipe(uglify({
    compress: {
      warnings: true
    }
  }))
  .pipe(gulp.dest(DIR.dist));
});

// gulp.task('watch', function() {
// 	livereload.listen({
// 		port: 34567
// 	});
// 	gulp.watch([DIR.SASS+'/**/*.s*ss'], ['sasscompile']);
// 	gulp.watch([
// 		DIR.source+'/**/*',
// 		'!'+DIR.SASS,
// 		'!'+DIR.source+'/assets/favicons',
//     '!'+DIR.source+'/assets/icons'
// 	], ['reload']);
// });

// gulp.task('reload', function(next){
// 	console.log('Reloading...');
// 	return gulp.src(DIR.source+'/*.html')
// 		.pipe(livereload());
// });

// Development
// gulp.task('dev', ['sasscompile','watch','api']);

// gulp.task('default', ['dev']);
