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

test('NGN.DOM.svg Fragment Update', function (t) {
  try {
    NGN.DOM.svg.update('<div id="nestandtest"><svg src="https://cdn.rawgit.com/gilbarbara/logos/master/logos/git.svg" class="test"></svg></div>', function (content) {
      document.body.insertAdjacentHTML('beforeend', content)
      t.ok(document.body.querySelector('div#nestandtest > svg > g > path') !== null, 'Found generated SVG code in DOM Fragment Update.')
      t.end()
    })
  } catch (e) {
    t.fail('Did not update fragment: ' + e.message)
  }
})

test('NGN.DOM.svg Direct DOM update', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<svg src="https://cdn.rawgit.com/gilbarbara/logos/master/logos/git.svg" class="test"></svg>')

  setTimeout(function () {
    NGN.DOM.svg.update(function () {
      t.ok(document.body.querySelector('svg > g > path') !== null, 'Found generated SVG code in direct DOM update.')
      t.end()
    })
  }, 300)
})

test('NGN.DOM.expandVoidHTMLTags', function (t) {
  var html = '<div><svg class="test"><rect x="1"/></svg></div>'
  var eHtml = NGN.DOM.expandVoidHTMLTags(html)

  t.ok(eHtml === '<div><svg class="test"><rect x="1"></rect></svg></div>')
  t.end()
})

test('NGN.DOM.guarantee', {
  timeout: 10000
}, function (t) {
  NGN.DOM.guarantee(document.body, '#testbutton', function (err, element) {
    t.pass('guarantee() callback invoked successfully')

    if (err) {
      t.fail(err.message)
    }

    t.ok(element.nodeName === 'BUTTON', 'Proper DOM element returned from guarantee().')

    var html = '<span id="guaranteeTest"><svg src="https://s3.amazonaws.com/uploads.hipchat.com/94386/693334/xCz24SJ9A3SFYUM/hamburger.svg" class="test"></svg></span>'
    NGN.DOM.svg.update(html, function (content) {
      NGN.DOM.guarantee(document.body, content, 8000, function (err2, el) {
        if (err2) {
          t.fail(err2.message)
        }

        t.pass('guarantee() invoked with text document fragment.')
        t.ok(document.body.querySelector('#guaranteeTest > svg > g > rect') !== null, 'Found generated SVG code in guaranteed DOM Fragment Update.')

        t.end()
      })

      document.body.insertAdjacentHTML('beforeend', content)
    })
  })

  setTimeout(function () {
    document.body.insertAdjacentHTML('beforeend', '<button id="testbutton"></button>')
  }, 300)
})

test('NGN.DOM.guarantee (When element already exists)', {
  timeout: 10000
}, function (t) {
  let html = '<div id="yo">test</div>'

  document.body.insertAdjacentHTML('beforeend', html)

  NGN.DOM.guarantee(document.body, html, function (err, element) {
    if (err) {
      t.fail(err.message)
    }

    t.pass('guarantee() callback invoked successfully when element exists.')
    t.ok(element.getAttribute('id') === 'yo', 'Proper DOME element returned in callback.')
    t.end()
  })
})

test('NGN.DOM.svg Warnings', function (t) {
  var src = '<svg src="https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"/>'

  setTimeout(function () {
    NGN.DOM.svg.update(src, function (content) {
      t.pass('No error thrown (just a warning).')
      t.end()
    })
  }, 700)
})

test('NGN.DOM.getElementSelector', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<div id="root"><div></div><div></div><div> <div id="ignored"></div><div> <div>test</div></div><div></div></div><div></div></div>')
  var selector = '#root > div:nth-child(3) > div:nth-child(2) > div:nth-child(1)'
  var element = document.body.querySelector(selector)

  t.ok(NGN.DOM.getElementSelector(element) === selector, 'Proper selector generated.')
  t.end()
  // <div id="root">
  //   <div></div>
  //   <div></div>
  //   <div>
  //     <div id="ignored"></div>
  //     <div>
  //       <div>test</div>
  //     </div>
  //     <div></div>
  //   </div>
  //   <div></div>
  // </div>
})

test('NGN.DOM.getCommonAncestor', function (t) {
  document.body.insertAdjacentHTML('beforeend', '<div id="testroot"><div></div><div></div><div id="domancestor"> <div class="findmeDOM"></div><div> <div>test</div></div><div> <div class="findmeDOM"></div><div> <span> <div class="findmeDOM"> </span> </div></div><div class="findmeDOM"></div></div><div></div></div>')
  var elements = document.querySelectorAll('.findmeDOM')
  var ancestor = NGN.DOM.getCommonAncestorDetail(elements)
  var a2 = NGN.DOM.getCommonAncestor(elements)

  t.ok(ancestor.element.id === 'domancestor', 'getCommonAncestorDetail() identified correct parent node.')
  t.ok(a2.id === 'domancestor', 'getCommonAncestor() identified correct parent node.')
  t.end()
})
