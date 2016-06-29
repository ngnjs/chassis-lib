'use strict'

require('localenvironment')
const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const header = require('gulp-header')
const del = require('del')
const MustHave = require('musthave')
const mh = new MustHave({
  throwOnError: false
})
const GithubPublisher = require('publish-release')
const fs = require('fs')
const path = require('path')
const pkg = require('./package.json')
let headerComment = '/**\n  * v' + pkg.version + ' generated on: '
  + (new Date()) + '\n  * Copyright (c) 2014-' + (new Date()).getFullYear()
  + ', Ecor Ventures LLC. All Rights Reserved. See LICENSE (BSD).\n  */\n'

const DIR = {
  source: path.resolve('./src'),
  dist: path.resolve('./dist')
}

// Build a release
gulp.task('build', ['clean', 'generate'])

// Check versions for Bower & npm
// gulp.task('version', function (next) {
//   console.log('Checking versions.')
//
//   // Sync Bower
//   let bower = require('./bower.json')
//   if (bower.version !== pkg.version) {
//     console.log('Updating bower package.')
//     bower.version = pkg.version
//     fs.writeFileSync(path.resolve('./bower.json'), JSON.stringify(bower, null, 2))
//   }
// })

// Create a clean build
gulp.task('clean', function (next) {
  console.log('Cleaning distribution.')
  try {
    fs.accessSync(DIR.dist, fs.F_OK)
    del.sync(DIR.dist)
  } catch (e) {}
  fs.mkdirSync(DIR.dist)
  next()
})

// Special files which need to be combined to funciton properly.
const combo = {
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
const common = [
  'dom.js',
  'bus.js',
  'reference.js',
  'net.js',
  'svg.js'
]

// Shared files.
const shared = {
  data: [
    'shared/data/utility.js',
    'shared/data/model.js',
    'shared/data/store.js',
    'shared/data/proxy.js'
  ]
}

const sanity = [
  'sanity.js'
]

const legacy = [
  'init/polyfill.js'
]

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

const expand = function (array) {
  return array.map(function (file) {
    return path.join(DIR.source, file)
  })
}

const walk = function (dir) {
  let files = []
  fs.readdirSync(dir).forEach(function (filepath) {
    filepath = path.join(dir, filepath)
    const stat = fs.statSync(filepath)
    if (stat.isDirectory()) {
      files = files.concat(walk(filepath))
    } else {
      files.push(filepath)
    }
  })
  return files
}

let files = {}
Object.defineProperties(files, {
  combo: {
    enumerable: true,
    get: function () {
      let assets = []
      let keys = Object.keys(combo)
      keys.forEach(function (filename) {
        let sources = combo[filename].map(function (partialFile) {
          return path.join(DIR.source, partialFile)
        })
        assets = assets.concat(sources)
      })
      return assets
    }
  },
  slim: {
    enumerable: true,
    get: function () {
      // let list = expand(Object.keys(combo))
      return this.combo.concat(expand(common))
    }
  },
  shared: {
    enumerable: true,
    get: function () {
      let sharedsrc = []
      Object.keys(shared).forEach(function (dir) {
        Object.keys(shared[dir]).forEach(function (subdir) {
          sharedsrc.push(path.join(DIR.source, shared[dir][subdir]))
        })
      })
      return sharedsrc
    }
  },
  legacy: {
    enumerable: true,
    get: function () {
      return expand(legacy)
    }
  },
  sanity: {
    enumerable: true,
    get: function () {
      return expand(sanity)
    }
  },
  prod: {
    enumerable: true,
    get: function () {
      return this.slim.concat(this.shared)
    }
  },
  dev: {
    enumerable: true,
    get: function () {
      return this.legacy.concat(this.slim.concat(this.sanity).concat(this.shared))
    }
  }
  // release: {
  //   enumerable: true,
  //   get: function () {
  //     return walk(DIR.dist).map(function (file) {
  //       file = file.replace(DIR.dist + path.sep, '').replace(path.sep, '.')
  //       return file
  //     })
  //   }
  // }
})
require('colors')
gulp.task('generate', function (next) {
  console.log('Generating distribution files in ', DIR.dist)

  console.log('chassis.slim.min.js\n'.cyan.bold, files.slim)
  console.log('=========================================')
  console.log('chassis.legacy.slim.min.js\n'.cyan.bold, files.legacy.concat(files.slim))
  console.log('=========================================')
  console.log('chassis.dev.js\n'.cyan.bold, files.dev)
  console.log('=========================================')
  console.log('chassis.min.js\n'.cyan.bold, files.prod)
  console.log('=========================================')
  console.log('chassis.legacy.min.js\n'.cyan.bold, files.legacy.concat(files.prod))
  console.log('=========================================')

  // Concatenate & minify combination files.
  let keys = Object.keys(combo)
  keys.forEach(function (filename) {
    let sources = combo[filename].map(function (partialFile) {
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
      gulp.src(files.shared)
        .pipe(concat(path.basename(filename).replace('.js', '.min.js')))
        .pipe(babel(babelConfig))
        .pipe(uglify(minifyConfig))
        .pipe(header(headerComment))
        .pipe(gulp.dest(path.join(DIR.dist, dir)))
    })
  })

  // Generate slim versions
  console.log('Generating slim file: chassis.slim.min.js')
  gulp.src(files.slim)
    .pipe(concat('chassis.slim.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

  console.log('Generating slim file: chassis.legacy.slim.min.js')
  gulp.src(files.legacy.concat(files.slim))
    .pipe(concat('chassis.legacy.slim.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))


  // Build dev version
  console.log('Generating dev file: chassis.dev.js')
  let babelConfig2 = babelConfig
  babelConfig2.compact = false
  gulp.src(files.dev)
    .pipe(concat('chassis.dev.js'))
    .pipe(babel(babelConfig2))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))


  // Make production release of dev file.
  console.log('Generating production file: chassis.min.js')
  gulp.src(files.prod)
    .pipe(concat('chassis.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))


  console.log('Generation legacy support file: chassis.legacy.min.js')
  gulp.src(files.legacy.concat(files.prod))
    .pipe(concat('chassis.legacy.min.js'))
    .pipe(babel(babelConfig))
    .pipe(uglify(minifyConfig))
    .pipe(header(headerComment))
    .pipe(gulp.dest(DIR.dist))

})

gulp.task('release', function (next) {
  if (!mh.hasAll(process.env, 'GITHUB_TOKEN', 'GITHUB_ACCOUNT', 'GITHUB_REPO')) {
    throw new Error('Release not possible. Missing data: ' + mh.missing.join(', '))
  }

  // Check if the release already exists.
  const https = require('https')

  https.get({
    hostname: 'api.github.com',
    path: '/repos/ngnjs/chassis-lib/releases',
    headers: {
      'user-agent': 'Release Checker'
    }
  }, function (res) {
    let data = ""
    res.on('data', function (chunk) {
      data += chunk
    })

    res.on('error', function (err) {
      throw err
    })

    res.on('end', function () {
      data = JSON.parse(data).filter(function (release) {
        return release.tag_name === pkg.version
      })

      if (data.length > 0) {
        console.log('Release ' + pkg.version + ' already exists. Aboting without error.')
        process.exit(0)
      }

      // Move the shared directories to the root of the distribution
      Object.keys(shared).forEach(function (dir) {
        const shareddir = path.join(DIR.dist, dir)
        try {
          fs.accessSync(shareddir, fs.F_OK)
          walk(shareddir).forEach(function (filepath) {
            let newpath = path.join(DIR.dist, filepath.replace(DIR.dist + path.sep, '').replace(path.sep, '.'))
            fs.renameSync(filepath, newpath)
          })
          del.sync(path.join(DIR.dist, dir))
        } catch (e) {}
      })

      const assets = walk(DIR.dist).sort()

      GithubPublisher({
        token: process.env.GITHUB_TOKEN,
        owner: process.env.GITHUB_ACCOUNT,
        repo: process.env.GITHUB_REPO,
        tag: pkg.version,
        name: pkg.version,
        notes: 'Releasing v' + pkg.version,
        draft: false,
        prerelease: false,
        reuseRelease: true,
        reuseDraftOnly: true,
        assets: assets,
        // apiUrl: 'https://myGHEserver/api/v3',
        target_commitish: 'master'
      }, function (err, release) {
        if (err) {
          err.errors.forEach(function (e) {
            console.error((e.resource + ' ' + e.code).red.bold)
          })
          process.exit(1)
        }
        console.log(release)
      })
    })
  })
})
