'use strict'

var test = require('tape')

test('Global', function (t) {
  t.ok(window.BUS !== undefined, 'BUS exists.')
  t.ok(window.ref !== undefined, 'ref exists.')
  t.ok(window.SVG !== undefined, 'SVG exists.')
  t.ok(window.HTTP !== undefined, 'HTTP exists.')
  t.end()
})