'use strict'

// Karma configuration
// Generated on Thu Nov 12 2015 07:04:29 GMT-0600 (CST)
require && require('localenvironment')
var caniuse = require('caniuse-api')
var lb = caniuse.getLatestStableBrowsers() // Latest Browsers

console.info('Latest Browsers:')
lb.forEach(function (b) {
  var lb = b.split(' ')
  if (lb[0].indexOf('_') < 0) {
    console.info('  - ' + lb[0] + ':', lb[1])
  }
})

module.exports = function (config) {
  var customLaunchers = {}

  lb.forEach(function (item) {
    item = item.split(' ')
    var browser = item[0]
    var version = item[1]

    switch (browser) {
      case 'chrome':
        for (var i = 45; i <= version; i++) {
          customLaunchers['cl_chrome_' + i.toString()] = {
            base: 'SauceLabs',
            browserName: 'chrome',
            version: i
          }
        }
        break
      case 'firefox':
        for (i = 41; i <= version; i++) {
          customLaunchers['cl_firefox_' + i.toString()] = {
            base: 'SauceLabs',
            browserName: 'firefox',
            version: i
          }
        }
        break
    //      case 'safari':
    //        for (var i = version; i >= (version - 1); i--) {
    //          customLaunchers['cl_safari_' + i.toString()] = {
    //            base: 'SauceLabs',
    //            browserName: 'safari',
    //            //platform: 'OS X 10.11',
    //            version: i.toString() + '.0'
    //          }
    //        }
    //        break
    //      case 'opera':
    //       for (var i = 32; i <= version; i++) {
    //          customLaunchers['cl_opera_' + i.toString()] = {
    //            base: 'SauceLabs',
    //            browserName: 'opera',
    //            version: i
    //          }
    //        }
    //        break
    //      case 'edge':
    //        for (var i = 13; i <= version; i++) {
    //          customLaunchers['cl_edge_' + i.toString()] = {
    //            base: 'SauceLabs',
    //            browserName: 'internet explorer',
    //            platform: 'Windows 10',
    //            version: parseInt(i, 10) // + 7 // Saucelabs has an incorrect version # for Edge
    //          }
    //        }
    //        break
    }
  })

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

  customLaunchers.cl_ie_11 = {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    platform: 'Windows 10',
    version: '11'
  }

  customLaunchers.cl_edge_20 = {
    base: 'SauceLabs',
    browserName: 'microsoftedge',
    platform: 'Windows 10',
    version: '20.10240'
  }

  config.set({
    browserNoActivityTimeout: 100000,

    sauceLabs: {
      testName: 'NGN Chassis JS Lib Unit Tests',
      build: process.env.TRAVIS_BUILD_NUMBER || 1,
      recordVideo: false,
      recordScreenshots: false,
      tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER,
      username: process.env.SAUCE_USERNAME,
      accessKey: process.env.SAUCE_ACCESS_KEY,
      startConnect: false,
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      }
    },

    customLaunchers: customLaunchers,

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-phantomjs-launcher'),
      require('karma-sauce-launcher'),
      require('karma-html2js-preprocessor')
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['tap', 'browserify'],

    // list of files / patterns to load in the browser
    files: [
      'dist/chassis.min.js',
      'test/*.js'
    ],

    // list of files to exclude
    exclude: [],

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
    reporters: ['saucelabs', 'spec'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: Object.keys(customLaunchers),
    // ['Chrome', 'Firefox', 'Safari', 'Opera', 'IE'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 1
  })
}
