'use strict'

var test = require('tape')

test('NGN.NET', function (t) {
  t.ok(NGN.NET instanceof Network, 'NGN.NET is available.')
  t.ok(typeof NGN.NET.xhr === 'function', 'NGN.NET.xhr is a valid method.')
  t.ok(typeof NGN.NET.run === 'function', 'NGN.NET.run is a valid method.')
  t.ok(typeof NGN.NET.processImport === 'function', 'NGN.NET.processImport is a valid method.')
  t.ok(typeof NGN.NET.domainRoot === 'function', 'NGN.NET.domainRoot is a valid method.')
  t.ok(typeof NGN.NET.isCrossOrigin === 'function', 'NGN.NET.isCrossOrigin is a valid method.')
  t.ok(typeof NGN.NET.prelink === 'function', 'NGN.NET.prelink is a valid method.')
  t.ok(typeof NGN.NET.send === 'function', 'NGN.NET.send is a valid method.')
  t.ok(typeof NGN.NET.get === 'function', 'NGN.NET.get is a valid method.')
  t.ok(typeof NGN.NET.head === 'function', 'NGN.NET.head is a valid method.')
  t.ok(typeof NGN.NET.put === 'function', 'NGN.NET.put is a valid method.')
  t.ok(typeof NGN.NET.post === 'function', 'NGN.NET.post is a valid method.')
  t.ok(typeof NGN.NET.delete === 'function', 'NGN.NET.delete is a valid method.')
  t.ok(typeof NGN.NET.json === 'function', 'NGN.NET.json is a valid method.')
  t.ok(typeof NGN.NET.import === 'function', 'NGN.NET.import is a valid method.')
  t.ok(typeof NGN.NET.importTo === 'function', 'NGN.NET.importTo is a valid method.')
  t.ok(typeof NGN.NET.importBefore === 'function', 'NGN.NET.importBefore is a valid method.')
  t.ok(typeof NGN.NET.predns === 'function', 'NGN.NET.predns is a valid method.')
  t.ok(typeof NGN.NET.preconnect === 'function', 'NGN.NET.preconnect is a valid method.')
  t.ok(typeof NGN.NET.prefetch === 'function', 'NGN.NET.prefetch is a valid method.')
  t.ok(typeof NGN.NET.prerender === 'function', 'NGN.NET.prerender is a valid method.')
  t.ok(typeof NGN.NET.subresource === 'function', 'NGN.NET.subresource is a valid method.')
  t.ok(typeof NGN.NET.template === 'function', 'NGN.NET.template is a valid method.')
  t.end()
})

// const uri = function (route) {
//   return 'http://127.0.0.1:9877' + route
// }

// test('NGN.NET Basic Web Requests', function (t) {
//   setTimeout(function () {
//     NGN.NET.get(uri('/net/test'), function (xres) {
//       setTimeout(function () {
//         console.log(xres.status)
//         t.ok(xres.status === 200, 'Basic GET method provides a response.')
//         t.end()
//       }, 300)
//     })
//   }, 300)
// })
