'use strict'

// Karma configuration
// Generated on Thu Nov 12 2015 07:04:29 GMT-0600 (CST)
require && require('localenvironment')

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
    'src/ngn.js',
    'src/dom.js',
    'src/bus.js',
    'src/reference.js',
    'src/http.js',
    'src/svg.js',
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

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
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
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.js': [ 'browserify' ],
      'test/test.html': 'html2js'
    },

    browserify: {
      debug: true
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
    logLevel: config.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: Infinity
  })
}
