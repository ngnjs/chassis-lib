'use strict'

var test = require('tape')

test('NGN.DOM', function (t) {
  var p = document.createElement('span')
  var hr = document.createElement('hr')
  var sel = 'body > span:first-of-type > hr:first-of-type'
  hr.setAttribute('id', 'test1')
  p.appendChild(hr)
  document.body.appendChild(p)
  t.ok(NGN.DOM.findParent(sel) !== null, 'NGN.DOM.findParent() works.')
  NGN.DOM.destroy(document.querySelector(sel))
  t.ok(NGN.DOM.findParent(sel) === null, 'NGN.DOM.destroy() works.')
  t.end()
})
