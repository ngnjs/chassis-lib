'use strict'

var test = require('tape')

test('NGN.DATA.Model', function (t) {
  t.ok(typeof NGN.DATA === 'object', 'NGN.DATA exists.')
  t.ok(NGN.DATA.Model !== undefined, 'NGN.DATA.Model exists.')

  NGN.BUS.once('field.update', function (c) {
    t.ok(c.field === 'firstname', 'Event fired for data change.')
    t.ok(!c.old, 'Old value recognized.')
    t.ok(c.new === 'Corey', 'New value recognized.')

    p.addField('middle')
  })

  NGN.BUS.once('field.create', function () {
    t.ok(p.hasDataField('middle'), 'Data field added successfully.')
    p.removeField('middle')
  })

  NGN.BUS.once('field.delete', function () {
    t.ok(!p.hasDataField('middle'), 'Data field removed successfully.')
    p.firstname = 'change1'
    p.firstname = 'change2'
    p.undo(2)
    t.ok(p.firstname === 'Corey', 'Undo operation rolls back to a prior state.')
    var obj = p.serialize()
    t.ok(obj.firstname === 'Corey' && obj.hasOwnProperty('lastname'), 'Serialization works.')
    t.ok(p.record.gn === 'Corey', 'Data map works.')

    NGN.BUS.once('field.invalid', function () {
      t.ok(!p.valid && p.invalidDataAttributes.indexOf('val') >= 0, 'Validators work.')
      t.ok(p.record.hasOwnProperty('gn'), 'Record data mapping works.')

      var store = new NGN.DATA.Store({
        model: Person
      })
      t.pass('New NGN.DATA.Store created.')

      store.add(p)
      t.ok(store.recordCount === 1, 'Added a new record via add(model)')

      store.add({
        firstname: 'John',
        lastname: 'Doe'
      })
      t.ok(store.recordCount === 2, 'Converted raw data to model and added to store.')

      t.ok(store.records[1].sn === 'Doe', 'Data mapping and record retrieval works.')
      store.remove(p)
      t.ok(store.recordCount === 1, 'Removed record by model.')
      t.ok(store.records[0].gn = 'Doe', 'Verified the removed record was the supposed to be removed.')
      store.remove(0)
      t.ok(store.recordCount === 0, 'Removed record by index.')

      store.add({
        firstname: 'John',
        lastname: 'Doe2'
      })

      store.add({
        firstname: 'John',
        lastname: 'Doe3'
      })

      t.ok(store.recordCount === 2, 'Added records after removal.')
      store.clear()
      t.ok(store.recordCount === 0, 'Cleared all records.')
      t.end()
    })

    p.val = 5
  })

  var Person = new NGN.DATA.Model({
    fields: {
      firstname: null,
      lastname: null,
      val: {
        min: 10,
        max: 20,
        default: 15
      }
    },
    dataMap: {
      firstname: 'gn',
      lastname: 'sn'
    }
  })

  t.ok(typeof Person === 'function', 'Model creation works.')

  var p = new Person()
  t.ok(p !== undefined, 'Model instantiation works.')
  p.firstname = 'Corey'
})
