'use strict'

var test = require('tape')

test('NGN.ref', function (t) {
  var p = document.createElement('span')
  var hr = document.createElement('hr')
  var sel = '#test2'

  hr.setAttribute('id', 'test2')
  p.appendChild(hr)
  document.body.appendChild(p)
  NGN.ref.create('test', sel)
  t.ok(NGN.ref.test !== undefined, 'NGN.ref.create() returns an HTMLElement.')
  t.ok(typeof NGN.ref.test.on === 'function', 'NGN.ref.<name>.on aliases addEventListener.')

  NGN.ref.test.on('click', function () {
    t.pass('NGN.ref.<name>.on alias successfully relays events.')
    t.ok(document.body.querySelector('#test2') !== null, '#test2 should exist')

    // remove the reference
    t.doesNotThrow(function () {
      NGN.ref.remove('test')
      t.ok(document.body.querySelector('#test2') !== null, '#test2 element should not be removed after removal of reference.')

      // TODO: Uncomment the line below once the test above passes (the reference should need to be recreated)
      NGN.ref.create('test', sel)
      t.ok(document.body.querySelector('#test2') !== null, '#test2 element should exist after creation.')
      t.end()
    }, 'NGN.ref.remove("test") should not throw an error')
  })

  document.querySelector(sel).click()
})
