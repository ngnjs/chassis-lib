'use strict'

require('localenvironment')
require('babel-plugin-proxy')
const gulp = require('gulp')
const concat = require('gulp-concat')
const uglify = require('gulp-uglify')
const babel = require('gulp-babel')
const header = require('gulp-header')
const footer = require('gulp-footer')
const sourcemaps = require('gulp-sourcemaps')
const ShortBus = require('shortbus')
// const Zip = require('gulp-zip')
const cp = require('child_process')
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
  'net.js',
  'svg.js'
]

// Shared files.
const shared = {
  data: [
    'shared/data/utility.js',
    'shared/data/model.js',
    'shared/data/store.js',
    'shared/data/proxy.js',
    'shared/data/httpproxy.js'
  ],
  tasks: [
    'shared/tasks/task.js',
    'shared/tasks/queue.js'
  ]
}

const sanity = [
  'sanity.js'
]

const legacy = [
  'init/polyfill.js'
]

const minifyConfig = {
  presets: ['es2015', 'es2017'],
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
  presets: ['es2015', 'es2017']
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
  core: {
    enumerable: true,
    get: function () {
      // let list = expand(Object.keys(combo))
      let list = this.combo.concat(expand(common))
      let tasks = expand(shared.tasks)
      list = list.concat(tasks)
      return list
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
      return this.core.concat(expand(shared.data))
    }
  },
  dev: {
    enumerable: true,
    get: function () {
      return this.legacy.concat(this.core.concat(expand(shared.data)).concat(this.sanity))
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
  const tasks = new ShortBus()
  const mapRoot = 'https://cdn.author.io/ngn/' + pkg.version
  const srcmapcfg = {
    includeContent: true,
    sourceMappingURL: function (file) {
      return mapRoot + '/' + file.relative + '.map'
    },
    sourceURL: function (file) {
      return file.relative.replace('.min.js', '.js')
    }
  }

  console.log('Generating distribution files in ', DIR.dist)
  console.log('core.min.js\n'.cyan.bold, files.core)
  console.log('==========================================')
  console.log('legacy.core.min.js\n'.cyan.bold, files.legacy.concat(files.core))
  console.log('=========================================')
  console.log('debug.js\n'.cyan.bold, files.dev)
  console.log('==========================================')
  console.log('complete.min.js\n'.cyan.bold, files.prod)
  console.log('==========================================')
  console.log('legacy.complete.min.js\n'.cyan.bold, files.legacy.concat(files.prod))
  console.log('==========================================')

  // Concatenate & minify combination files.
  let keys = Object.keys(combo)
  keys.forEach(function (filename) {
    tasks.add(function (cont) {
      let sources = combo[filename].map(function (partialFile) {
        return path.join(DIR.source, partialFile)
      })

      console.log('Generating combined file:', filename)
      if (filename === 'ngn.js') {
        gulp.src(sources)
          .pipe(concat(filename.replace('.js', '.min.js')))
          .pipe(babel(babelConfig))
          .pipe(uglify(minifyConfig))
          .pipe(header(headerComment))
          .pipe(footer(`Object.defineProperty(NGN, 'version', NGN.const('${pkg.version}'))`))
          .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
          .pipe(gulp.dest(DIR.dist))
          .on('end', cont)
      } else {
        gulp.src(sources)
          .pipe(concat(filename.replace('.js', '.min.js')))
          .pipe(babel(babelConfig))
          .pipe(uglify(minifyConfig))
          .pipe(header(headerComment))
          .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
          .pipe(gulp.dest(DIR.dist))
          .on('end', cont)
        }
    })
  })

  // Minify common files
  common.forEach(function (filename) {
    tasks.add(function (cont) {
      console.log('Generating common file:', filename)
      gulp.src(path.join(DIR.source, filename))
        .pipe(sourcemaps.init())
        .pipe(concat(filename.replace('.js', '.min.js')))
        .pipe(babel(babelConfig))
        .pipe(uglify(minifyConfig))
        .pipe(header(headerComment))
        .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
        .pipe(gulp.dest(DIR.dist))
        .on('end', cont)
    })
  })

  // Minify shared output files
  Object.keys(shared).forEach(function (dir) {
    shared[dir].forEach(function (filename) {
      tasks.add(function (cont) {
        gulp.src(path.join(DIR.source, filename))
          .pipe(sourcemaps.init())
          .pipe(concat(path.basename(filename).replace('.js', '.min.js')))
          .pipe(babel(babelConfig))
          .pipe(uglify(minifyConfig))
          .pipe(header(headerComment))
          .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
          .pipe(gulp.dest(path.join(DIR.dist, dir)))
          .on('end', cont)
      })
    })
  })

  // Generate slim/core versions
  tasks.add(function (cont) {
    console.log('Generating core (slim) file: core.min.js')
    gulp.src(files.core)
      .pipe(sourcemaps.init())
      .pipe(concat('core.min.js'))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(footer(`Object.defineProperty(NGN, 'version', NGN.const('${pkg.version}'))`))
      .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.add(function (cont) {
    console.log('Generating core (slim) file: legacy.core.min.js')
    gulp.src(files.legacy.concat(files.core))
      .pipe(concat('legacy.core.min.js'))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(footer(`Object.defineProperty(NGN, 'version', NGN.const('${pkg.version}'))`))
      .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  // Generate debug version
  tasks.add(function (cont) {
    console.log('Generating debug (unminified dev) file: debug.js')
    // let babelConfig2 = babelConfig
    // babelConfig2.compact = false
    gulp.src(files.dev)
      .pipe(concat('debug.js'))
      .pipe(babel(babelConfig))
      .pipe(header(headerComment))
      .pipe(footer(`\nObject.defineProperty(NGN, 'version', NGN.const('${pkg.version}')); console.info('%cDebugging%c NGN v${pkg.version}', 'font-weight: bold;', 'font-weight: normal')`))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.add(function (cont) {
    console.log('Generating legacy debug file: legacy.debug.js')
    gulp.src(files.legacy.concat(files.prod))
      .pipe(concat('legacy.debug.js'))
      .pipe(babel(babelConfig))
      .pipe(header(headerComment))
      .pipe(footer(`\nObject.defineProperty(NGN, 'version', NGN.const('${pkg.version}')); console.info('%cDebugging%cUNGN v${pkg.version}', 'font-weight: bold;', 'font-weight: normal')`))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  // Generate primary production versions
  tasks.add(function (cont) {
    console.log('Generating compelete/full production file: complete.min.js')
    gulp.src(files.prod)
      .pipe(sourcemaps.init())
      .pipe(concat('complete.min.js'))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(footer(`Object.defineProperty(NGN, 'version', NGN.const('${pkg.version}'))`))
      .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.add(function (cont) {
    console.log('Generating legacy production support file: legacy.complete.min.js')
    gulp.src(files.legacy.concat(files.prod))
      .pipe(sourcemaps.init())
      .pipe(concat('legacy.complete.min.js'))
      .pipe(babel(babelConfig))
      .pipe(uglify(minifyConfig))
      .pipe(header(headerComment))
      .pipe(footer(`Object.defineProperty(NGN, 'version', NGN.const('${pkg.version}'))`))
      .pipe(sourcemaps.write('./sourcemaps', srcmapcfg))
      .pipe(gulp.dest(DIR.dist))
      .on('end', cont)
  })

  tasks.on('complete', function () {
    // Zip the sourcemaps into a single archive
    const maps = fs.readdirSync(path.join(DIR.dist, 'sourcemaps'))
    if (maps.length > 0) {
      console.log('\nCreating sourcemap archive...')
      var gzip = require('gulp-vinyl-zip')
      return gulp.src(path.join(DIR.dist, 'sourcemaps', '/**/*'))
        .pipe(gzip.dest(path.join(DIR.dist, 'sourcemaps.zip')))
        .on('end', function () {
          setTimeout(function () {
            console.log('Done archiving sourcemaps.')
          }, 2000)
        })
      // gulp.src(path.join(DIR.dist, 'sourcemaps', '/*'))
      //   .pipe(Zip('sourcemaps.zip', {compress: true}))
      //   .pipe(gulp.dest(DIR.dist))
      //   .on('end', function () {
      //     setTimeout(function () {
      //       del.sync(path.join(DIR.dist, 'sourcemaps'))
      //     }, 10000)
      //   })
    }
  })

  tasks.process(true)
})

// gulp.task('prereleasecheck', function (next) {
//   console.log('Checking if package already exists.')
//   const child = cp.spawn('npm', ['info', pkg.name])
//
//   let data = ""
//   child.stdout.on('data', function (chunk) {
//     data += chunk.toString()
//   })
//   child.on('close', function () {
//     const re = new RegExp('latest: \'' + pkg.version + '\'')
//     if (re.exec(data) === null) {
//       next()
//     } else {
//       console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
//       process.exit(0)
//     }
//   })
// })

gulp.task('release', function (next) {
  console.log('Checking if package already exists.')
  const child = cp.spawn('npm', ['info', pkg.name])

  let data = ""

  child.stdout.on('data', function (chunk) {
    data += chunk.toString()
  })

  child.on('close', function () {
    const re = new RegExp('latest: \'' + pkg.version + '\'')
    if (re.exec(data) === null) {
      if (!mh.hasAll(process.env, 'GITHUB_TOKEN', 'GITHUB_ACCOUNT', 'GITHUB_REPO')) {
        throw new Error('Release not possible. Missing data: ' + mh.missing.join(', '))
      }

      // Check if the release already exists.
      const https = require('https')

      https.get({
        hostname: 'api.github.com',
        path: '/repos/' + process.env.GITHUB_ACCOUNT + '/' + process.env.GITHUB_REPO + '/releases',
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
            console.log('Release ' + pkg.version + ' already exists. Aborting without error.')
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
    } else {
      console.log('The version has not changed (' + pkg.version + '). A new release is unnecessary. Aborting deployment with success code.')
      process.exit(0)
    }
  })
})
