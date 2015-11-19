'use strict'

var test = require('tape')

test('NGN.DATA.Model', function (t) {
  t.ok(typeof NGN.DATA === 'object', 'NGN.DATA exists.')
  t.ok(NGN.DATA.Model !== undefined, 'NGN.DATA.Model exists.')

  NGN.BUS.once('field.update', function (c) {
    t.ok(c.field === 'firstname', 'Event fired for data change.')
    t.ok(!c.old, 'Old value recognized.')
    t.ok(c.new === 'Corey', 'New value recognized.')

    var obj = p.serialize()
    t.ok(obj.firstname === 'Corey' && obj.hasOwnProperty('lastname'), 'Serialization works.')
    t.end()
  })

  var Person = new NGN.DATA.Model({
    fields: {
      firstname: null,
      lastname: null
    }
  })

  t.ok(typeof Person === 'function', 'Model creation works.')

  var p = new Person()
  t.ok(p !== undefined, 'Model instantiation works.')
  p.firstname = 'Corey'
})
