'use strict'

var test = require('tape')

test('NGN.REF Sanity Check', function (t) {
  t.ok(NGN.hasOwnProperty('REF'), 'NGN.REF is not defined.')
  t.ok(typeof NGN.REF === 'object', 'NGN.REF is a singleton.')
  t.ok(NGN.hasOwnProperty('ref'), 'NGN.ref alias is not defined.')
  t.end()
})

test('NGN.REF Basic Functionality', function (t) {
  var p = document.createElement('span')
  var hr = document.createElement('hr')
  var sel = '#test2'

  hr.setAttribute('id', 'test2')
  p.appendChild(hr)

  document.body.appendChild(p)

  var x = NGN.REF.create('test', sel)

  t.ok(NGN.ref.test !== undefined, 'NGN.REF.create() creates a reference.')
  t.ok(x !== undefined, 'NGN.REF.create() returns a reference object.')
  t.ok(typeof NGN.ref.test.on === 'function', 'NGN.REF.<name>.on aliases addEventListener.')

  NGN.REF.test.once('click', function () {
    t.pass('NGN.ref.<name>.on alias successfully relays events.')
    t.ok(document.body.querySelector('#test2') !== null, '#test2 should exist')

    // remove the reference
    t.doesNotThrow(function () {
      NGN.REF.remove('test')
      t.ok(document.body.querySelector('#test2') !== null, '#test2 element should not be removed after removal of reference.')

      // TODO: Uncomment the line below once the test above passes (the reference should need to be recreated)
      NGN.REF.create('test', sel)
      t.ok(document.body.querySelector('#test2') !== null, '#test2 element should exist after creation.')

      t.doesNotThrow(function () {
        console.log(NGN.REF.test)
        NGN.REF.test.classList.add('dummyCSS')
        t.ok(NGN.ref.test.classList.contains('dummyCSS'), 'Element attribute set successfully.')
      }, 'Setting a basic DOM property does not throw an error.')

      NGN.REF.remove('test') // Cleanup
      t.end()
    }, 'NGN.REF.remove("test") should not throw an error')
  })

  var element = document.querySelector(sel)
  element.click()
})

test('NGN.REF Enhanced Event Management', function (t) {
  var sel = '#test2'
  var element = document.querySelector(sel)

  NGN.REF.create('test', sel)
  NGN.REF.test.on({
    click: function () {
      t.pass('Event pooling recognized.')
      NGN.BUS.emit('_pool_')
    },

    mouseover: function () {}
  })

  NGN.REF.test.once('click', function () {
    t.pass('One-time events fire properly.')
    NGN.BUS.emit('_one-off_')
  })

  NGN.BUS.funnelOnce(['_one-off_', '_pool_'], 'done')
  NGN.BUS.once('done', function () {
    t.end()
  })

  element.click()
})

test('NGN.REF Multi-Element Selectors (Basic)', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<span class="dex">a</span><span class="dex">b</span>')

  NGN.REF.create('group', 'span.dex')

  NGN.BUS.thresholdOnce('counted', 2, 'done')

  NGN.REF.group.on('click', function () {
    NGN.BUS.emit('counted')
  })

  NGN.BUS.once('done', function () {
    t.pass('One event handler applied to multiple elements successfully.')
    t.end()
  })

  var elements = document.querySelectorAll('.dex')

  for (var i = 0; i < elements.length; i++) {
    elements[i].click()
  }
})

test('NGN.REF.Multi-Element Selectors (Complex)', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<div id="root"><div></div><div></div><div id="ancestoral"> <div id="ignored"></div><div> <div>test</div></div><div> <div class="findme"></div><div> <span> <div class="findme"> </span> </div></div><div class="findme"></div></div><div></div></div>')

  var elements = NGN.slice(document.querySelectorAll('.findme'))

  NGN.REF.create('complex', '.findme')
  NGN.BUS.thresholdOnce('counted', elements.length, 'done')

  NGN.REF.complex.on('click', function () {
    NGN.BUS.emit('counted')
  })

  NGN.BUS.once('done', function () {
    t.pass('One event handler applied to multiple complexly nested elements successfully.')
    t.end()
  })

  for (var i = 0; i < elements.length; i++) {
    elements[i].click()
  }
})

test('NGN.REF JSON Data', function (t) {
  NGN.REF.create('group', 'span.dex')
  NGN.REF.create('test', '#test2')

  t.ok(typeof NGN.REF.json === 'object', 'JSON object is available for introspection.')
  t.ok(
    NGN.REF.json.hasOwnProperty('group') &&
    NGN.REF.json.hasOwnProperty('test') &&
    NGN.REF.json.group === 'span.dex' &&
    NGN.REF.json.test === '#test2', 'References are properly represented as a JSON object.')
  t.end()
})
