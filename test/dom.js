'use strict'

var test = require('tape')

test('NGN.DOM', function (t) {
  var p = document.createElement('span')
  var hr = document.createElement('hr')
  var p2 = document.createElement('p')
  var sel = '#test1'
  var sel2 = 'body > span:first-of-type > p:last-of-type'
  hr.setAttribute('id', 'test1')
  p.appendChild(hr)
  p.appendChild(p2)
  document.body.appendChild(p)
  t.ok(NGN.DOM.findParent(sel) !== null, 'NGN.DOM.findParent() works.')
  NGN.DOM.destroy(document.querySelector(sel))
  t.ok(NGN.DOM.findParent(sel) === null, 'NGN.DOM.destroy() works.')
  var p3 = document.createElement('p')
  p.appendChild(p3)
  t.ok(NGN.DOM.indexOfParent(document.querySelector(sel2)) === 1, 'NGN.DOM.indexOfParent() works.')
  t.end()
})
