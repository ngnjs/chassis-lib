'use strict'

var test = require('tape')

/**
 * ======= NOTICE =======
 * When adding a regression test, document the issue # (required)
 * where it can be referenced and (optionally) a super short synopsis.
 *
 * For example:
 *
 * // @issue 137
 * // Adding values fails.
 *
 * You can learn more about the tap/tape testing syntax
 * at https://www.npmjs.com/package/tape
 */

test('Regressions', function (t) {
  // @issue 11
  // https://github.com/ngnjs/chassis-lib/issues/11
  // NGN.NET.run should not throw an error
  t.doesNotThrow(function () {
    NGN.NET.run('GET', 'http://localhost', function () {})
  })

  // @issue 18
  // https://github.com/ngnjs/chassis-lib/issues/18
  // Store.sort() should work after Store.addFilter()
  var Person = new NGN.DATA.Model({
    autoid: true,
    fields: {
      last: {
        type: String
      }
    }
  })

  var People = new NGN.DATA.Store({
    model: Person,
    allowDuplicates: false
  })

  var people = [{
    last: 'Moritz'
  }, {
    last: 'Butler'
  }, {
    last: 'Hudson'
  }]

  people.forEach(function (p) {
    People.add(p)
  })

  People.addFilter(function (p) {
    return true // return every person in the table
  })

  People.sort({
    last: 'asc'
  })

  t.ok(People.data[0].last === 'Butler', 'Sorted store orders first element properly.')
  t.ok(People.data[1].last === 'Hudson', 'Sorted store orders second element properly.')
  t.ok(People.data[2].last === 'Moritz', 'Sorted store orders last element properly.')
  t.end()
})
