'use strict'

var test = require('tape')

test('NGN.DOM', function (t) {
  t.ok(typeof NGN.DOM.svg.update === 'function', 'SVG update exists.')

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

test('NGN.DOM.svg Direct DOM update', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<svg src="https://cdn.rawgit.com/gilbarbara/logos/master/logos/git.svg"></svg>')

  setTimeout(function () {
    NGN.DOM.svg.update()

    setTimeout(function () {
      t.ok(document.body.querySelector('svg > g > path') !== null, 'Did not find generated SVG code.')
      t.end()
    }, 300)
  }, 300)
})

test('NGN.DOM.svg Fragment Update', function (t) {
  try {
    NGN.DOM.svg.update('<svg src="https://cdn.rawgit.com/gilbarbara/logos/master/logos/git.svg"></svg>')
    t.pass('NGN.DOM.svg.update of DocumentFragment succeeded.')
    t.end()
  } catch (e) {
    t.fail('Did not update fragment: ' + e.message)
  }
})
