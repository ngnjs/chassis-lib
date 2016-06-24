'use strict'

// Karma configuration
// Generated on Thu Nov 12 2015 07:04:29 GMT-0600 (CST)
require && require('localenvironment')
var _browser = 'Chrome'
if (process.argv.indexOf('--firefox') >= 0) {
  _browser = 'Firefox'
}
if (process.argv.indexOf('--safari') >= 0) {
  _browser = 'Safari'
}
var getFiles = function () {
  if (process && process.env && process.env.npm_config_argv) {
    var cli = JSON.parse(process.env.npm_config_argv)
    if (cli.original && cli.original.length > 1 && cli.original[1] === 'localtest') {
      return [
        'dist/chassis.min.js',
        'test/*.js',
        'test/test.html'
      ]
    }
  }
  return [
    'src/init/core.js',
    'src/shared/core.js',
    'src/ngn.js',
    'src/eventemitter.js',
    'src/shared/eventemitter.js',
    'src/shared/exception.js',
    'src/init/exception.js',
    'src/dom.js',
    'src/bus.js',
    'src/reference.js',
    'src/net.js',
    'src/svg.js',
    'src/shared/data/utility.js',
    'src/shared/data/model.js',
    'src/shared/data/store.js',
    'src/shared/data/proxy.js',
    'test/*.js',
    'test/test.html'
  ]
}

module.exports = function (config) {
  config.set({
    sauceLabs: {
      testName: 'NGN Chassis JS Lib Unit Tests',
      build: process.env.TRAVIS_BUILD_NUMBER || 1,
      recordVideo: false,
      recordScreenshots: true
    },

    specReporter: {
      maxLogLines: 5,         // limit number of lines logged per test
      suppressErrorSummary: false,  // do not print error summary
      suppressFailed: false,  // do not print information about failed tests
      suppressPassed: true,  // do not print information about passed tests
      suppressSkipped: true,  // do not print information about skipped tests
      showSpecTiming: false // print the time elapsed for each spec
    },

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-safari-launcher'),
      require('karma-html2js-preprocessor')
    //      require('karma-phantomjs-launcher'),
    //      require('karma-sauce-launcher')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['tap', 'browserify'],

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
    reporters: ['spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_WARN,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: [_browser],
    // ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity
  })

// var http = require('http')
// var server = http.createServer()
//
// server.listen(9111)
// server.on('request', function (req, res) {
//   switch (req.url) {
//     case '/ping':
//       res.statusCode = 200
//       console.log('pinged')
//       res.end()
//       break
//     case '/person':
//       switch (req.method.toLowerCase()) {
//         default:
//           console.log(req.body)
//           break
//       }
//       break
//     default:
//       console.log(req.url)
//       break
//   }
// })
}
