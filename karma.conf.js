'use strict'

// The last command line argument.
const mode = (process.env.hasOwnProperty('BUILD_MODE') ? process.env.BUILD_MODE : 'dev').toLowerCase()

// Karma configuration
// Generated on Thu Nov 12 2015 07:04:29 GMT-0600 (CST)
require && require('localenvironment')

var _browser
var caniuse
var useDistributionFiles = null
var reporterEngines = ['spec']
var customLaunchers = {}
var browsers = ['chrome']
var sauceConfiguration = {
  testName: 'NGN Chassis JS Lib Unit Tests',
  build: process.env.SEMAPHORE_BUILD_NUMBER || 1,
  recordVideo: false,
  recordScreenshots: false
}

switch (mode) {
  case 'live':
    console.warn('Running a live developer test.')
    useDistributionFiles = false
  case 'prod': // eslint-disable-line no-fallthrough
    useDistributionFiles = typeof useDistributionFiles === 'boolean' ? useDistributionFiles : true

    // Latest Browsers
    caniuse = require('caniuse-api')
    var lb = caniuse.getLatestStableBrowsers() // eslint-disable-line no-unused-vars

    browsers.push('firefox')

    var b = {}
    lb = lb.forEach(function (item, index, arr) {
      item = item.split(' ')
      b[item[0].toLowerCase()] = item[1]
    })

    Object.keys(b).forEach(function (browser) {
      var version = b[browser] // eslint-disable-line no-unused-vars
      var willtest = false // eslint-disable-line no-unused-vars

      // if (browser === 'firefox') {
      //   version -= 1
      // }

      if (browsers.indexOf(browser) >= 0 || // eslint-disable-line no-mixed-operators
        !useDistributionFiles && browser === 'edge' || // eslint-disable-line no-mixed-operators
        (useDistributionFiles && ['edge', 'ie', 'safari'].indexOf(browser) >= 0)) {
        willtest = true
      }

      // console.info('  - ' + browser + ':', version + (willtest ? ' ---> WILL BE TESTED' : ''))

      if (browsers.indexOf(browser) >= 0) {
        // version = version - 1
        customLaunchers['cl_' + browser + '_' + version.toString()] = {
          base: 'SauceLabs',
          browserName: browser,
          version: browser === 'chrome' ? 55 : (browser === 'firefox' ? 50 : version)
        }
      }
    })

    customLaunchers.cl_edge_20 = {
      base: 'SauceLabs',
      browserName: 'microsoftedge',
      platform: 'Windows 10',
      version: '14'
    }

    if (useDistributionFiles) {
      customLaunchers.cl_safari_8 = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.10',
        version: '8'
      }

      customLaunchers.cl_safari_9 = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.11',
        version: '9'
      }

      customLaunchers.cl_safari_10 = {
        base: 'SauceLabs',
        browserName: 'safari',
        platform: 'OS X 10.12',
        version: '10'
      }

      customLaunchers.cl_ie_11 = {
        base: 'SauceLabs',
        browserName: 'internet explorer',
        platform: 'Windows 10',
        version: '11'
      }

      customLaunchers.cl_chrome_45 = {
        base: 'SauceLabs',
        browserName: 'chrome',
        platform: 'Windows 7',
        version: '45'
      }

      customLaunchers.cl_firefox_50 = {
        base: 'SauceLabs',
        browserName: 'firefox',
        platform: 'Windows 7',
        version: '50'
      }
    }

    console.log('Testing Browsers:')
    Object.keys(customLaunchers).forEach(function (launcher) {
      console.info('  - ' + customLaunchers[launcher].browserName + ':', customLaunchers[launcher].version)
    })

    sauceConfiguration.tunnelIdentifier = process.env.SEMAPHORE_PROJECT_HASH_ID
    sauceConfiguration.username = process.env.SAUCE_USERNAME
    sauceConfiguration.accessKey = process.env.SAUCE_ACCESS_KEY
    sauceConfiguration.startConnect = true
    sauceConfiguration.connectOptions = {
      port: 5757,
      logfile: 'sauce_connect.log',
      logger: function (message) {
        console.log('[SAUCECONNECT]', message)
      }
    }

    reporterEngines.unshift('saucelabs')

    break

  default:
    useDistributionFiles = false

    // dev mode
    _browser = 'Chrome'
    if (process.argv.indexOf('--firefox') >= 0) {
      _browser = 'Firefox'
    }

    if (process.argv.indexOf('--safari') >= 0) {
      _browser = 'Safari'
    }

    if (process.argv.indexOf('--edge') >= 0) {
      _browser = 'Edge'
      useDistributionFiles = true
    }

    if (process.argv.indexOf('--ie') >= 0) {
      _browser = 'IE'
      useDistributionFiles = true
    }

    break
}

var getFiles = function () {
  var files

  if (useDistributionFiles) {
    files = [
      'dist/legacy.debug.js'
    ]
  } else {
    files = [
      'src/init/core.js',
      'src/shared/core.js',
      'src/ngn.js',
      'src/eventemitter.js',
      'src/shared/eventemitter.js',
      'src/shared/exception.js',
      'src/init/exception.js',
      'src/dom.js',
      'src/bus.js',
      // 'src/reference.js',
      'src/net.js',
      'src/svg.js',
      'src/shared/tasks/task.js',
      'src/shared/tasks/queue.js',
      'src/shared/data/utility.js',
      'src/shared/data/model.js',
      'src/shared/data/store.js',
      'src/shared/data/proxy.js',
      'src/shared/data/httpproxy.js'
    ]
  }

  if (process.argv.indexOf('--unit') >= 0) {
    return files.concat([
      'test/' + process.argv[process.argv.indexOf('--unit') + 1] + '.js',
      'test/test.html'
    ])
  }

  return files.concat([
    'test/*.js',
    'test/test.html'
  ])
}

module.exports = function (config) {
  // If a distribution is required, make it.
  if (useDistributionFiles) {
    const cp = require('child_process')
    console.info('\nBuilding distribution files.\n')
    let stdout = cp.execSync('npm run build')
    console.log(stdout.toString())
    setTimeout(function () {
      console.info('Distribution ready.')
    }, 3000)
  }

  // let express = require('express')
  // let webapp = express()
  //
  // webapp.use(function (req, res, next) {
  //   console.log('\n============= REQUEST RECEIVED =============')
  //   next()
  // })
  // webapp.get('/net', function (req, response) {
  //   response.sendStatus(200)
  // })
  //
  // webapp.post('/net', function (req, response) {
  //   response.sendStatus(201)
  // })
  //
  // webapp.put('/net', function (req, response) {
  //   response.sendStatus(200)
  // })
  //
  // webapp.delete('/net', function (req, response) {
  //   response.sendStatus(200)
  // })
  //
  // webapp.head('/net', function (req, response) {
  //   response.sendStatus(200)
  // })
  //
  // webapp.listen(9877, function () {
  //   console.log('Listening on port 9877')
  // })
  //
  // webapp.on('end', function () {
  //   console.log('\n\n============= CLOSED MOCK WEB SERVER =============')
  // })
  //
  // setTimeout(function () {
  //   webapp.close()
  // }, 110000)

  config.set({
    browserDisconnectTimeout: 120000,
    browserDisconnectTolerance: 10,
    browserNoActivityTimeout: 120000,

    specReporter: {
      maxLogLines: 5,         // limit number of lines logged per test
      suppressErrorSummary: mode !== 'dev',  // do not print error summary
      suppressFailed: false,  // do not print information about failed tests
      suppressPassed: true,  // do not print information about passed tests
      suppressSkipped: true,  // do not print information about skipped tests
      showSpecTiming: false // print the time elapsed for each spec
    },

    sauceLabs: sauceConfiguration,

    customLaunchers: customLaunchers,

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-safari-launcher'),
      require('karma-ie-launcher'),
      require('karma-ie-launcher'),
      require('karma-edge-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-sauce-launcher'),
      require('karma-html2js-preprocessor')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['tap', 'browserify'],

    // expressServer: {
    //   port: 9877,
    //   extensions: [
    //     function (app, logger) {
    //       app.get('/test', function (req, res, next) {
    //         logger.info('/test hit')
    //         res.send('ok')
    //       })
    //     }
    //   ]
    // },

    // list of files / patterns to load in the browser
    files: getFiles(),

    // list of files to exclude
    exclude: [],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.js': [ 'browserify' ],
      'test/test.html': 'html2js'
    },

    browserify: {
      debug: false
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: reporterEngines,

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: mode === 'dev' ? config.LOG_DEBUG : config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: mode === 'dev' ? [_browser] : Object.keys(customLaunchers),
    // ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browsers should be started simultaneously
    concurrency: 3
  })
}
