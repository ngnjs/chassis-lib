'use strict'

var gulp = require('gulp')
var concat = require('gulp-concat')
var uglify = require('gulp-uglify')
var babel = require('gulp-babel')
var header = require('gulp-header')
var del = require('del')
var fs = require('fs')
var path = require('path')
var pkg = require('./package.json')
var headerComment = '/**\n  * v' + pkg.version + ' generated on: '
  + (new Date()) + '\n  * Copyright (c) 2014-' + (new Date()).getFullYear()
  + ', Ecor Ventures LLC. All Rights Reserved. See LICENSE (BSD).\n  */\n'

var DIR = {
  source: path.resolve('./src'),
  shared: path.resolve('./src/shared'),
  dist: path.resolve('./dist')
}

// Build a release
gulp.task('build', ['version', 'clean', 'copy'])

// Check versions for Bower & npm
gulp.task('version', function (next) {
  console.log('Checking versions.')

  // Sync Bower
  var bower = require('./bower.json')
  if (bower.version !== pkg.version) {
    console.log('Updating bower package.')
    bower.version = pkg.version
    fs.writeFileSync(path.resolve('./bower.json'), JSON.stringify(bower, null, 2))
  }
})

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  if (fs.existsSync(DIR.dist)) {
    del.sync(DIR.dist)
  }
  fs.mkdirSync(DIR.dist)
  next()
})

// Special files which need to be combined to funciton properly.
var combo = {
  'ngn.js': [
    'init/core.js',
    'shared/core.js',
    'ngn.js'
  ],
  'eventemitter.js': [
    'eventemitter.js',
    'shared/eventemitter.js'
  ],
  'exception.js': [
    'shared/exception.js',
    'init/exception.js'
  ]
}

// Common Files
var common = [
  'dom.js',
  'bus.js',
  'reference.js',
  'net.js',
  'svg.js'
]

// Shared files.
var shared = {
  data: [
    'shared/data/utility.js',
    'shared/data/model.js',
    'shared/data/store.js',
    'shared/data/proxy.js'
  ]
}

// var buildSharedDirectory = function (dir, root) {
//   root = root || DIR.dist
//   if (typeof dir === 'object' && !Array.isArray(dir)) {
//     fs.mkdirSync(path.join(root, dir))
//     Object.keys(dir).forEach(function (subdir) {
//       buildSharedDirectory(dir[subdir], path.join(root, dir))
//     })
//   }
// }

const minifyConfig = {
  presets: ['es2015'],
  mangle: true,
  compress: {
    dead_code: true,
    global_defs: {
      DEBUG: false
    },
    warnings: true,
    drop_debugger: true,
    unused: true,
    if_return: true,
    passes: 3
  }
}

const babelConfig = {
  presets: ['es2015']
}

gulp.task('copy', function (next) {
  console.log('Copying distribution files to ', DIR.dist)

  // Concatenate & minify combination files.
  var keys = Object.keys(combo)
  keys.forEach(function (filename) {
    var sources = combo[filename].map(function (partialFile) {
      return path.join(DIR.source, partialFile)
    })

    console.log('Generating combined file:', filename)
    gulp.src(sources)
      .pipe(concat(filename.replace('.js', '.min.js')))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(gulp.dest(DIR.dist))
  })

  // Minify common files
  common.forEach(function (filename) {
    console.log('Generating common file:', filename)
    gulp.src(path.join(DIR.source, filename))
      .pipe(concat(filename.replace('.js', '.min.js')))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(gulp.dest(DIR.dist))
  })

  // Minify shared output files
  Object.keys(shared).forEach(function (dir) {
    shared[dir].forEach(function (filename) {
      gulp.src(path.join(DIR.source, filename))
        .pipe(concat(path.basename(filename).replace('.js', '.min.js')))
        .pipe(babel(babelConfig))
        .pipe(uglify(minifyConfig))
        .pipe(header(headerComment))
        .pipe(gulp.dest(path.join(DIR.dist, dir)))
    })
  })

  var allfiles = []
  var devFiles = []
  Object.keys(combo).forEach(function (filename) {
    combo[filename].forEach(function (file) {
      allfiles.push(file)
      devFiles.push(file)
    })
  })

  allfiles = allfiles.concat(common)
  // add sanity layer to devFiles
  common.unshift('sanity.js')
  devFiles = devFiles.concat(common)

  // Generate slim versions
  function generateSlim (files) {
    return files.map(function (filepath) {
      return path.join(DIR.source, filepath)
    })
  }
  var slim = generateSlim(allfiles)
  var devSlim = generateSlim(devFiles)

  console.log('Generating slim file: chassis.slim.min.js')
  gulp.src(slim)
    .pipe(concat('chassis.slim.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  // Generate full production file
  var sharedsrc = []
  Object.keys(shared).forEach(function (dir) {
    Object.keys(shared[dir]).forEach(function (subdir) {
      sharedsrc.push(path.join(DIR.source, shared[dir][subdir]))
    })
  })

  // Merge all files with shared.
  allfiles = slim.concat(sharedsrc)
  devFiles = devSlim.concat(sharedsrc)

  console.log('Generating dev file: chassis.dev.js')
  var babelConfig2 = babelConfig
  babelConfig2.compact = false
  gulp.src(devFiles)
    .pipe(concat('chassis.dev.js'))
    .pipe(babel(babelConfig2))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  console.log('Generating legacy dev file: chassis.legacy.dev.js')
  var babelConfig2 = babelConfig
  babelConfig2.compact = false
  var legacyFiles = devFiles
  legacyFiles.unshift(path.join(DIR.source, 'init/polyfill.js'))
  gulp.src(legacyFiles)
    .pipe(concat('chassis.legacy.dev.js'))
    .pipe(babel(babelConfig2))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  // Make production release of dev file.
  console.log('Generating production file: chassis.min.js')
  gulp.src(allfiles)
    .pipe(concat('chassis.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))


  console.log('Generation legacy support file: chassis.legacy.min.js')
  allfiles.unshift()
  gulp.src(legacyFiles)
    .pipe(concat('chassis.legacy.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  // return next()

  // sources.forEach(function (file, index) {
  //   gulp.src(file)
  //   // .pipe(concat(files[index].replace(/\//gi,'.') + '.min.js'))
  //   .pipe(minify(file, files[index].replace(/\//gi,'.') + '.min.js'))
  //   // .pipe(uglify({
  //   //   mangle: true,
  //   //   compress: {
  //   //     warnings: true
  //   //   }
  //   // }))
  //   .pipe(header(headerComment))
  //   .pipe(gulp.dest(DIR.dist))
  // })
// console.log('YO')
//   // Generate full project
//   gulp.src(sources)
//   .pipe(concat('chassis.dev.js'))
//   .pipe(header(headerComment))
//   .pipe(gulp.dest(DIR.dist))
// console.log('YO2')
//   gulp.src(sources.slice(0, slim))
//   .pipe(concat('chassis.slim.min.js'))
//   // .pipe(uglify({
//   //   mangle: true,
//   //   compress: {
//   //     warnings: true
//   //   }
//   // }))
//   .pipe(header(headerComment))
//   .pipe(gulp.dest(DIR.dist))
// console.log('YO3')
//   gulp.src(sources)
//   .pipe(concat('chassis.min.js'))
//   // .pipe(uglify({
//   //   mangle: true,
//   //   compress: {
//   //     warnings: true
//   //   }
//   // }))
//   .pipe(header(headerComment))
//   .pipe(gulp.dest(DIR.dist))
//   console.log('YO4')
//   next()
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
