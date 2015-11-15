'use strict'

var test = require('tape')

test('Global', function (t) {
  t.ok(window.NGN !== undefined, 'NGN namespace exists.')
  t.ok(NGN.define !== undefined, 'NGN.define() exists.')
  var x = {}
  Object.defineProperties(x, {
    y: NGN.define(true, false, false, 1)
  })
  t.ok(x.y === 1, 'NGN.define() works.')

  t.ok(typeof NGN._od === 'function', 'NGN._od() object definition alias exists.')
  NGN._od(x, 'z', true, false, false, 2)
  t.ok(x.z === 2, 'NGN._od() works.')

  t.ok(typeof NGN._get === 'function', 'NGN._get() alias exists.')
  var y = {}
  Object.defineProperties(y, {
    x: NGN.define(true, false, false, 1),
    z: NGN._get(function () {
      return this.x
    })
  })
  t.ok(y.x === y.z, 'NGN._get() works.')

  t.ok(typeof NGN._slice === 'function', 'NGN._slice alias exists for Array.prototype.slice.call')
  t.ok(NGN._slice(arguments).length === 1, 'NGN._slice alias works.')

  t.ok(typeof NGN._splice === 'function', 'NGN._splice alias exists for Array.prototype.splice.call')
  t.ok(NGN._splice(arguments, 1).length === 0, 'NGN._splice alias works.')

  t.ok(window.NGN.BUS !== undefined, 'NGN.BUS exists.')
  t.ok(window.NGN.HTTP !== undefined, 'NGN.HTTP exists.')
  t.ok(window.NGN.ref !== undefined, 'NGN.ref exists.')
  t.ok(window.NGN.DOM !== undefined, 'NGN.DOM exists.')
  t.ok(window.NGN.DOM.svg !== undefined, 'NGN.DOM.svg exists.')
  t.end()
})
