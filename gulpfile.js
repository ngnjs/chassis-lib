'use strict'

/**
 * TODO:
 *  - Add a clean build task
 *  - Monitor removed files and strip from production.
 *  - Setup remote deployment (production)
 */
var gulp = require('gulp')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var del = require('del')
var fs = require('fs')
var path = require('path')

var DIR = {
  source: path.resolve('./src'),
  dist: path.resolve('./dist')
}

// Build a release
gulp.task('build', ['clean', 'copy'])

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  if (fs.existsSync(DIR.dist)) {
    del.sync(DIR.dist)
  }
  fs.mkdirSync(DIR.dist)
  next()
})

gulp.task('copy', function () {
  console.log('Copying distribution files to ', DIR.dist)
  var files = ['ngn', 'dom', 'bus', 'reference', 'http', 'svg']
  var sources = files.map(function (file) {
    return path.join(DIR.source, file + '.js')
  })

  // Copy individual files
  gulp.src(sources, {
    base: DIR.source
  }).pipe(gulp.dest(DIR.dist))

  // Minify each individual file
  sources.forEach(function (file, index) {
    gulp.src(file)
    .pipe(concat(files[index] + '.min.js'))
    .pipe(uglify({
      mangle: true,
      compress: {
        warnings: true
      }
    }))
    .pipe(gulp.dest(DIR.dist))
  })

  // Generate full project
  gulp.src(sources)
  .pipe(concat('chassis.js'))
  .pipe(gulp.dest(DIR.dist))

  return gulp.src(sources)
  .pipe(concat('chassis.min.js'))
  .pipe(uglify({
    mangle: true,
    compress: {
      warnings: true
    }
  }))
  .pipe(gulp.dest(DIR.dist))
})

gulp.task('optimize', function () {
  return gulp.src(path.join(DIR.dist, 'chassis.min.js'))
  .pipe(uglify({
    compress: {
      warnings: true
    }
  }))
  .pipe(gulp.dest(DIR.dist))
})
