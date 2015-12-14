# NGN Chassis library [![GitHub version](https://badge.fury.io/gh/ngnjs%2Fchassis-lib.svg)](https://badge.fury.io/gh/ngnjs%2Fchassis-lib)

The NGN Chassis JS library is a JavaScript library for smart/lazy people. It is one part
of the [NGN](http://ngn.js.org) platform, designed for orchestrating interactivity between  components of a web app. It doesn't try to mask JavaScript or the DOM... as a web developer, 
you should know how those things work. Instead, the Chassis JS library focuses on simplifying how apps are pieced together. It enforces strong but flexible standards that can be used by an
individual developer, but make sense in a team environment.

## Getting Started

The easiest (and recommended) way to use Chassis is via a CDN. 

```html
<script src="//cdn.jsdelivr.net/chassis/latest/chassis.min.js"></script>
```

You can also specify a specific [release](https://github.com/ngnjs/chassis-lib/releases) instead
of using `latest`.

### Load only what you need

Chassis is relatively small, but you can make it even smaller by only including the features you
need. For example, if you only need the event `DOM` and `BUS` capabilities, you can retrieve them
in one HTTP call via:

```html
<script src="//cdn.jsdelivr.net/g/chassis(ngn.min.js+DOM.min.js+BUS.min.js)"></script>
```

**ngn.min.js should ALWAYS be first.** It is responsible for namespacing and private methods used by the entire library. It's also ridiculously tiny.

You can [generate a custom URL](http://www.jsdelivr.com/projects/chassis) with the JSDelivr CDN.

You can see a list of all available [individual components](https://github.com/ngnjs/chassis-lib/tree/master/dist). Any file that _doesn't_ begin
with `chassis.___` is an individual component. Keep in mind that some components rely on
others. Since these dependencies may change as this library evolves, we've embedded
warnings. So, if something doesn't look right, your console output should give you
a clue. Everything depends on `ngn.min.js`, so that should always be included. The
`NGN.DOM` and `NGN.BUS` are both major features for most Chassis projects. The order
in which you include individual components is also important, so if you see a warning
indicating a library isn't loaded (even though you have included it), it
means you need to to modify the order of the independent files. When in doubt, just
look at the source code. The dependencies are right at the top of each file.

### Debugging | Development

Find an error in Chassis? Unminified versions are available (full library only) through the [rawgit CDN](https://rawgit.com). You must specify the version as shown below.

```html
<script src="//cdn.rawgit.com/ngnjs/chassis-lib/<version>/dist/chassis.dev.js"></script>
```

# Reporting Issues

If you encounter an issue, please file it in the issues. We'll do our best to fix
problems in a timely manner, but remember this is software we voluntarily support
(one of [several projects](https://github.com/ngnjs)).

If you want to expedite resolution, one of the most effective ways to do so is to
[write a regression test](https://github.com/ngnjs/chassis-lib/wiki/Writing-a-Regression-Test).
By adding a regression test, you're recreating the issue, saving us alot of time.

# Hacking on Chassis

If you want to hack on Chassis, fork the repository and make your changes.
Make sure they pass the existing unit tests, and (if appropriate) add new
unit tests.

Chassis uses [karma](http://karma-runner.github.io/) and [tap/tape](https://www.npmjs.com/package/tape) for unit testing. For pre-production CI testing, we use [Sauce Labs](http://saucelabs.com) to test against a myriad of browsers. However; this can
be a time consuming process when making lots of changes or simple small updates. 

To make development easier, there is a separate npm script for running a "gut check" within your 
local development environment: `npm run-script localtest`. It only tests against Chrome, which
must be installed on your local computer to work. This opens a new Chrome window, runs the tests, then closes Chrome. Again, this is a "gut check" designed for rapid local development. Most tests
that pass in Chrome will pass is other modern browsers, but not everything. If you have concerns,
check [caniuse.com](http://caniuse.com) to see what is supported and what isn't.

At this time, Chassis targets support for Chrome 40+, Firefox 31+, IE 11, Edge 13, Safari 9, and
Opera 27. Since Opera tracks Chrome, we're not terribly concerned with Opera tests as long as
Chrome tests pass. When Microsoft Edge support becomes more prevalent, we will eventually drop IE
support.

# Project Status

[![Build Status](https://travis-ci.org/ngnjs/chassis-lib.svg?branch=master)](https://travis-ci.org/ngnjs/chassis-lib)

[![Sauce Test Status](https://saucelabs.com/browser-matrix/coreybutler.svg)](https://saucelabs.com/u/coreybutler)