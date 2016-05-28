'use strict'

var test = require('tape')

test('NGN.ref', function (t) {
  var p = document.createElement('span')
  var hr = document.createElement('hr')
  // var sel = 'body > span:first-of-type > hr:first-of-type'
  var sel = '#test2'
  hr.setAttribute('id', 'test2')
  p.appendChild(hr)
  document.body.appendChild(p)
  NGN.ref.create('test', sel)
  t.ok(NGN.ref.test !== undefined, 'NGN.ref.create() returns an HTMLElement.')
  t.ok(typeof NGN.ref.test.on === 'function', 'NGN.ref.<name>.on aliases addEventListener.')

  NGN.ref.test.on('click', function () {
    t.pass('NGN.ref.<name>.on alias successfully relays events.')
    t.end()
  })

  document.querySelector(sel).click()
})
