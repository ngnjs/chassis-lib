'use strict'

var test = require('tape')

test('Global', function (t) {
  t.ok(window.NGN !== undefined, 'NGN namespace exists.')
  t.ok(window.NGN.BUS !== undefined, 'NGN.BUS exists.')
  t.ok(window.NGN.HTTP !== undefined, 'NGN.HTTP exists.')
  t.ok(window.NGN.ref !== undefined, 'NGN.ref exists.')
  t.ok(window.NGN.DOM !== undefined, 'NGN.DOM exists.')
  t.ok(window.NGN.DOM.svg !== undefined, 'NGN.DOM.svg exists.')
  t.end()
})
