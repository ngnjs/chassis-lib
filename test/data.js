'use strict'

var test = require('tape')

// Common data
var meta = {
  idAttribute: 'testid',
  fields: {
    firstname: null,
    lastname: null,
    val: {
      min: 10,
      max: 20,
      default: 15
    },
    testid: null
  },
  dataMap: {
    firstname: 'gn',
    lastname: 'sn'
  }
}

test('NGN.DATA.Model', function (t) {
  t.ok(typeof NGN.DATA === 'object', 'NGN.DATA exists.')
  t.ok(NGN.DATA.Model !== undefined, 'NGN.DATA.Model exists.')

  var Person = new NGN.DATA.Model(meta)

  t.ok(typeof Person === 'function', 'Model creation works.')

  var p = new Person()
  t.ok(p !== undefined, 'Model instantiation works.')

  p.once('field.update', function (c) {
    t.ok(c.field === 'firstname', 'Event fired for data change.')
    t.ok(!c.old, 'Old value recognized.')
    t.ok(c.new === 'Corey', 'New value recognized.')

    p.addField('middle')
  })

  p.once('field.create', function () {
    t.ok(p.hasDataField('middle'), 'Data field added successfully.')
    p.removeField('middle')
  })

  p.once('field.remove', function () {
    t.ok(!p.hasDataField('middle'), 'Data field removed successfully.')
    p.firstname = 'change1'
    p.firstname = 'change2'
    p.undo(2)
    t.ok(p.firstname === 'Corey', 'Undo operation rolls back to a prior state.')
    var obj = p.serialize()
    t.ok(obj.firstname === 'Corey' && obj.hasOwnProperty('lastname'), 'Serialization works.')
    t.ok(p.data.gn === 'Corey', 'Data map works.')

    p.once('field.invalid', function () {
      t.ok(!p.valid && p.invalidDataAttributes.indexOf('val') >= 0, 'Validators work.')
      t.ok(p.data.hasOwnProperty('gn'), 'Record data mapping works.')

      var person = new Person({
        gn: 'Doug',
        sn: 'Adams'
      })
      t.ok(person.firstname === 'Doug', 'Load with a data map and autoconvert to friendly names.')

      var store = new NGN.DATA.Store({
        model: Person,
        index: ['firstname']
      })
      t.pass('New NGN.DATA.Store created.')
      t.ok(store._index.hasOwnProperty('firstname'), 'Indexing enabled.')

      store.add(p)
      t.ok(store.recordCount === 1, 'Added a new record via add(model)')

      store.add({
        firstname: 'John',
        lastname: 'Doe'
      })
      t.ok(store.recordCount === 2, 'Converted raw data to model and added to store.')

      t.ok(store.data[1].sn === 'Doe', 'Data mapping and record retrieval works.')
      store.remove(p)
      t.ok(store.recordCount === 1, 'Removed record by model.')
      t.ok(store.data[0].gn = 'Doe', 'Verified the removed record was the one supposed to be removed.')
      store.remove(0)
      t.ok(store.recordCount === 0, 'Removed record by index.')

      store.add({
        firstname: 'John',
        lastname: 'Doe2',
        testid: 'test'
      })

      store.add({
        firstname: 'John',
        lastname: 'Doe3'
      })

      t.ok(store.recordCount === 2, 'Added records after removal.')

      store.add({
        firstname: 'John',
        lastname: 'Doe3'
      })

      t.ok(store.recordCount === 3, 'Added duplicate without error.')
      store.deduplicate()

      t.ok(store.recordCount === 2, 'Store.deduplicate() removes duplicates.')

      t.ok(store.find(0).lastname === 'Doe2', 'Find by index.')
      t.ok(store.find(function (rec) { return rec.lastname === 'Doe2' })[0].lastname === 'Doe2', 'Find by filter function.')
      t.ok(store.find('test').lastname === 'Doe2', 'Find by ID.')

      store.load({
        firstname: 'The',
        lastname: 'Doctor'
      }, {
        firstname: 'Rose',
        lastname: 'Tyler'
      }, {
        firstname: 'Jack',
        lastname: 'Harkness'
      })
      t.ok(store.recordCount === 5, 'Data load() adds records.')

      store.reload({
        firstname: 'Rose',
        lastname: 'Tyler'
      }, {
        firstname: 'Jack',
        lastname: 'Harkness'
      }, {
        firstname: 'The',
        lastname: 'Doctor'
      })
      t.ok(store.recordCount === 3, 'Reload records.')

      store.addFilter(function (rec) {
        return rec.firstname.indexOf('e') >= 0
      })
      t.ok(store.records.length === 2, 'Basic filter.')
      t.ok(store.filtered.length === 1, 'Retrieve filtered records.')

      store.addFilter(function (rec) {
        return rec.firstname === 'The'
      })
      t.ok(store.records.length === 1 && store.records[0].lastname === 'Doctor', 'Multiple filters.')
      store.clearFilters()
      t.ok(store.records.length === 3, 'Clear filters.')

      store.add({
        firstname: 'The',
        lastname: 'Master'
      })

      store.sort({
        firstname: 'desc',
        lastname: 'asc'
      })

      t.ok(store.find(0).lastname === 'Doctor', 'Sorting with multiple attributes.')
      store.sort({
        firstname: function (a, b) {
          if (a.firstname === 'The') {
            return -1
          }
          return a.firstname > b.firstname
        },
        lastname: 'asc'
      })

      t.ok(store.find(0).firstname === 'The' && store.find(1).lastname === 'Master', 'Complex sorting.')

      var query = store.find({
        firstname: 'The',
        val: 15
      })
      t.ok(query.length === 2 && query[0].firstname === 'The' && query[1].lastname === 'Master', 'Complex search with indexing returns proper results.')

      store.find(0).val = 10
      query = store.find({
        firstname: 'The',
        val: 15
      })

      t.ok(query.length === 1 && query[0].lastname === 'Master', 'Updated searching with mixed indexes returns proper results.')
      t.ok(store.indexOf(query[0]) === 1, 'Identify the index number of a specific record within the store.')
      t.ok(store.contains(query[0]), 'Store.contains(record) correctly identifies existance of a real record.')

      var dne = new Person({
        firstname: 'Fake',
        lastname: 'Person'
      })

      t.ok(!store.contains(dne), 'Store.contains(record) correctly indicates no record exists.')

      store.add({
        firstname: 'The',
        lastname: 'Master'
      })

      store.clear()
      t.ok(store.recordCount === 0, 'Cleared all records.')
      t.end()
    })

    p.val = 5
  })

  p.firstname = 'Corey'
})

test('NGN.DATA.Model Basic Proxy', function (t) {
  var m = meta
  m.autoid = false
  m.proxy = new NGN.DATA.Proxy({
    url: 'http://nodomain.com'
  })

  var Human = new NGN.DATA.Model(m)
  var RoseTyler = new Human({
    firstname: 'Rose',
    lastname: 'Tyler'
  })

  t.ok(typeof RoseTyler.save === 'function' &&
    typeof RoseTyler.fetch === 'function' &&
    Array.isArray(RoseTyler.changelog), 'Proxy applied to model successfully.')

  t.end()
})

test('NGN.DATA.Store Basic Proxy', function (t) {
  var m = meta
  var p = new NGN.DATA.Proxy({
    url: 'http://nodomain.com'
  })

  m.autoid = false
  var Human = new NGN.DATA.Model(m)
  var Peeps = new NGN.DATA.Store({
    model: Human,
    proxy: p
  })

  Peeps.load([{
    firstname: 'The',
    lastname: 'Doctor'
  }])

  t.ok(Peeps.proxy !== null, 'Store has a proxy associated with it.')
  t.ok(Peeps.proxy.url === 'http://nodomain.com', 'Proxy attributes are accessible through proxy scope.')
  t.ok(typeof Peeps.save === 'function', 'Save method is available.')
  t.ok(typeof Peeps.fetch === 'function', 'Fetch method is available.')
  t.ok(typeof Peeps.changelog === 'object', 'Changelog is available.')

  Peeps.add({
    firstname: 'The',
    lastname: 'Master'
  })

  t.ok(Peeps.changelog.create[0].lastname === 'Master', 'Creation tracked.')

  Peeps.find(Peeps.changelog.create[0]).val = 12

  t.ok(Peeps.changelog.update.length === 0, 'Modifying a new record only triggers a creation action.')

  Peeps.find(1).val = 13

  t.ok(Peeps.changelog.update.length === 1, 'Modifying an existing record triggers an update action.')

  Peeps.remove(Peeps.changelog.create[0])

  t.ok(Peeps.changelog.create.length === 0, 'Deleting a created record neutralizes action.')

  t.end()
})

test('NGN.DATA.Model Basic Events', function (t) {
  var m = meta
  m.autoid = false
  var Human = new NGN.DATA.Model(m)
  var Peeps = new NGN.DATA.Store({
    model: Human
  })

  Peeps.once('record.create', function (record) {
    var bob = Peeps.records[0]
    t.ok(bob.firstname = 'Bob', 'Record creation event heard.')

    // set up a field.invalid listener which should never be triggered
    bob.on('field.invalid', function (e) {
      t.fail('The fieldname ' + e.field + ' was marked invalid, but should be valid')
    })

    // Bob should have a default value of 15
    t.ok(bob.val === 15)

    // setting Bob's value to 19 should not trigger the field.invalid event
    bob.val = 19

    t.ok(bob.valid, 'Record should still be valid')
    t.end()
  })

  Peeps.add({
    firstname: 'Bob',
    lastname: 'Ferapples'
  })
})

test('NGN.DATA.Model ID Generation', function (t) {
  // Test ID autogeneration
  var m2 = meta
  m2.autoid = true
  var TestModel = new NGN.DATA.Model(m2)
  var genid = new TestModel()
  t.ok(genid.testid.length === 36, 'Autogenerated ID.')
  var noid = new TestModel({
    testid: 'simpletest',
    firstname: 'none'
  })
  t.ok(noid.testid === 'simpletest', 'Do not autogenerate ID when an ID is explicitly defined.')
  delete meta.idAttribute
  var m3 = meta
  var T2 = new NGN.DATA.Model(m3)
  var t2 = new T2({
    firstname: 'fname'
  })
  t.ok(t2.id.length === 36, 'Autogenerated ID with unspecified default id attribute.')
  t.ok(t2.data.hasOwnProperty('id'), 'Autogenerated ID is serialized.')
  var m4 = meta
  m4.autoid = false
  var T3 = new NGN.DATA.Model(m4)
  var _t3 = new T3({
    firstname: '3rdtest'
  })
  _t3.once('field.update', function (delta) {
    t.ok(!_t3.modified, 'Reverting to original data does not trigger a modification flag.')
    t.end()
  })
  _t3.firstname = _t3.firstname
})

test('NGN.DATA.Model Nesting', function (t) {
  var SubM = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var M = new NGN.DATA.Model({
    fields: {
      a: null
    },
    relationships: {
      sub: {
        type: SubM,
        default: {}
      }
    }
  })

  var m = new M({
    a: 'test'
  })

  t.ok(m.hasOwnProperty('sub'), 'Nested model reference exists.')
  t.ok(m.sub.test === 'yo', 'Nested model reference returns proper data fields.')
  t.ok(m.data.sub.test === 'yo', 'Nested model serialization works')
  t.end()
})

test('NGN.DATA.Store Nesting', function (t) {
  var _SubM2 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var _M2 = new NGN.DATA.Model({
    fields: {
      a: null
    },
    relationships: {
      sub: {
        type: _SubM2
      }
    }
  })

  var _M3 = new NGN.DATA.Model({
    fields: {
      a: null
    },
    relationships: {
      sub: {
        type: {
          model: _SubM2,
          allowDuplicates: false
        }
      }
    }
  })

  var _m2 = new _M2({
    a: 'test'
  })

  _m2.sub.test = 'yo yo'

  var _m3 = new _M3({
    a: 'test'
  })

  _m3.sub.add({
    test: 'yo yo ma'
  })

  t.ok(_m2.hasOwnProperty('sub'), 'Nested model reference exists.')
  t.ok(_m2.sub.test === 'yo yo', 'Nested model reference returns proper data fields.')
  t.ok(_m2.data.sub.test === 'yo yo', 'Nested model serialization works')
  t.ok(_m3.sub.records[0].test === 'yo yo ma', 'Nested model reference returns proper data fields with fully defined store configuration.')
  t.ok(_m3.data.sub[0].test === 'yo yo ma', 'Nested model serialization works with fully defined store configuration')
  t.end()
})

test('NGN.DATA.Model Expiration by Milliseconds', function (t) {
  var TestModel = new NGN.DATA.Model({
    expires: 1000, // Expires in 1 second
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var testRecord = new TestModel({
    test: 'value'
  })

  testRecord.on('expired', function () {
    t.pass('"expired" event recognized (by number).')
    t.ok(testRecord.expired, 'Expired records are marked as "expired" (by number).')
    t.end()
  })

  t.ok(!testRecord.expired, 'The record does not expire until the specified time (by number).')
})

test('NGN.DATA.Model Expiration by Date/Time', function (t) {
  var currentDate = new Date()
  var dt = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    currentDate.getDate(),
    currentDate.getHours(),
    currentDate.getMinutes(),
    currentDate.getSeconds() + 1, // Add a second
    currentDate.getMilliseconds()
  )

  var TestModel = new NGN.DATA.Model({
    expires: dt, // Expires in 1 second
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var testRecord = new TestModel({
    test: 'value'
  })

  testRecord.on('expired', function () {
    t.pass('"expired" event recognized (by date).')
    t.ok(testRecord.expired, 'Expired records are marked as "expired" (by date).')
    t.end()
  })

  t.ok(!testRecord.expired, 'The record does not expire until the specified time (by date).')
})

test('NGN.DATA.Model Force Expiration', function (t) {
  var TestModel = new NGN.DATA.Model({
    expires: 1000, // Expires in 1 second
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var testRecord = new TestModel({
    test: 'value'
  })

  testRecord.on('expired', function () {
    t.pass('"expired" event recognized when model is forcibly expired.')
    t.ok(testRecord.expired, 'Record is marked as expired.')

    testRecord.once('expired', function () {
      t.fail('Expiring a record multiple times works (it shouldn\'t).')
    })

    setTimeout(function () {
      t.pass('Calling expire() multiple times does not re-expire record.')
      t.end()
    }, 500)

    testRecord.expire()
  })

  testRecord.expire()

  t.ok(testRecord.expired, 'The record is forcibly expired.')
})

test('NGN.DATA.Store TTL', function (t) {
  var TestModel = new NGN.DATA.Model({
    expires: 1000, // Expires in 1 second
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore = new NGN.DATA.Store({
    model: TestModel
  })

  TestStore.add({
    test: 'yo'
  })

  TestStore.on('record.delete', function (record) {
    t.ok(record.expired, 'The expired record was automatically removed from the store.')
    t.ok(TestStore.recordCount === 0, 'Record removed from store automatically.')
    t.end()
  })

  t.ok(TestStore.first.test === 'yo', 'Record is available.')
})

test('NGN.DATA.Store Disable TTL', function (t) {
  var TestModel = new NGN.DATA.Model({
    expires: 1000, // Expires in 1 second
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var record = new TestModel({
    test: 'value'
  })

  record.disableExpiration()

  setTimeout(function () {
    t.ok(!record.expired, 'The record did not expire.')
    t.end()
  }, 1800)
})

test('NGN.DATA.Store Soft Delete & Restore', function (t) {
  var TestModel2 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore2 = new NGN.DATA.Store({
    model: TestModel2,
    softDelete: true,
    softDeleteTtl: 1500
  })

  TestStore2.add({
    test: 'value1'
  })

  TestStore2.on('record.expired', function () {
    t.fail('A "record.expired" event was triggered after the record was restored.')
  })

  TestStore2.once('record.restored', function () {
    t.pass('record.restored event triggered.')
    t.ok(TestStore2.first.test === 'value1', 'Proper record was restored.')

    var checksum = TestStore2.first.checksum
    TestStore2.once('record.purged', function (purgedRecord) {
      t.ok(purgedRecord.checksum === checksum, 'Proper record purged.')
      t.ok(TestStore2.recordCount === 0, 'Store cleared.')
      t.end()
    })

    // Wait past the soft delete TTL to assure the record remains
    setTimeout(function () {
      t.ok(TestStore2.recordCount === 1, 'The restored record remains beyond softDeleteTtl.')
      TestStore2.remove(TestStore2.first)
    }, 2500)
  })

  TestStore2.once('record.delete', function (deletedRecord) {
    t.ok(TestStore2.recordCount === 0, 'Removed record with softDelete enabled.')
    TestStore2.restore(deletedRecord.checksum)
  })

  TestStore2.remove(TestStore2.first)
})

test('NGN.DATA.Model Field Update Events', function (t) {
  var TestModel3 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var mod = new TestModel3({
    test: 'initial value'
  })

  t.ok(mod.test === 'initial value', 'Initial value set correctly.')

  mod.on('field.update.test', function (change) {
    t.pass('Field-specific update event fired.')
    t.ok(change.field === 'test', 'Proper field name associated with the payload.')
    t.ok(change.old === 'initial value', 'The "old" value accurately represents the initial value.')
    t.ok(change.new === 'new value', 'The "new" value accurately represents the update value.')
    t.end()
  })

  mod.test = 'new value'
})

test('NGN.DATA.Store Reindexing', function (t) {
  var TestModel4 = new NGN.DATA.Model({
    autoid: true,
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore4 = new NGN.DATA.Store({
    model: TestModel4
  })

  var a = TestStore4.add({
    test: 'a'
  })

  var b = TestStore4.add({
    test: 'b'
  })

  var c = TestStore4.add({
    test: 'c'
  })

  // Move by index
  TestStore4.move(0, 2)
  t.ok(TestStore4.last.test === 'a', 'Successfully moved record by index number (forward).')
  t.ok(TestStore4.first.test === 'b', 'Validated record by index number (forward).')

  TestStore4.move(2, 0)
  t.ok(TestStore4.first.test === 'a', 'Successfully moved record by index number (backward).')
  t.ok(TestStore4.last.test === 'c', 'Validated record by index number (backward).')

  // Move by model
  TestStore4.move(a, b)
  t.ok(TestStore4.first.test === 'b' && TestStore4.records[1].test === 'a', 'Move by model.')

  // Test Event Handler
  TestStore4.once('record.move', function (data) {
    t.pass('record.move fired.')
    t.ok(data.oldIndex = 2 && data.newIndex === 0 && data.record.test === 'c', 'record.move delivers correct payload.')
    t.ok(TestStore4.first.test === 'c', 'Move by ID.')
    t.end()
  })

  // Move by ID
  TestStore4.move(c.id, 0)
})

test('NGN.DATA.Store Insertion', function (t) {
  var TestModel4 = new NGN.DATA.Model({
    autoid: true,
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore4 = new NGN.DATA.Store({
    model: TestModel4
  })

  TestStore4.add({
    test: 'a'
  })

  TestStore4.add({
    test: 'b'
  })

  TestStore4.add({
    test: 'c'
  })

  TestStore4.once('record.create', function (record) {
    t.pass('record.create triggered for insertBefore()')
    t.ok(TestStore4.records[1].test === 'd', 'Added record before existing 2nd element.')

    TestStore4.once('record.create', function (rec) {
      t.ok(TestStore4.records[1].test === 'e', 'Added record after existing 1st element.')
      t.end()
    })

    TestStore4.insertAfter(0, {
      test: 'e'
    })
  })

  TestStore4.insertBefore(1, {
    test: 'd'
  })
})

test('NGN.DATA.Model Validity Events', function (t) {
  var TestModel5 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo',
        // Dummy Validator
        validate: function (value) {
          return value !== 'dummy'
        }
      }
    }
  })

  var x = new TestModel5({
    test: 'somevalue'
  })

  x.once('field.invalid', function (data) {
    t.pass('field.invalid event triggered.')
    t.ok(x.test === 'dummy', 'Invalid event triggered by appropriate data.')

    x.once('field.valid', function (data2) {
      t.pass('field.valid event triggered.')
      t.ok(x.test === 'ok', 'Valid event triggered by appropriate data.')
      t.end()
    })

    x.test = 'ok'
  })

  x.test = 'dummy'
})

test('NGN.DATA.Store Validity Events', function (t) {
  var TestModel6 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo',
        // Dummy Validator
        validate: function (value) {
          return value !== 'dummy'
        }
      }
    }
  })

  var TestStore6 = new NGN.DATA.Store({
    model: TestModel6
  })

  TestStore6.on('record.invalid', function () {
    t.pass('record.invalid event triggered when a record becomes invalid.')
    t.ok(TestStore6.first.test === 'dummy', 'Invalid data triggered record.invalid event.')

    TestStore6.on('record.valid', function () {
      t.pass('record.valid event triggered when invalid record becomes valid again.')
      t.ok(TestStore6.first.test === 'ok', 'Valid data triggered record.valid event.')
      t.end()
    })

    TestStore6.first.test = 'ok'
  })

  TestStore6.add({
    test: 'somevalue'
  })

  t.ok(TestStore6.first.test === 'somevalue', 'Initial value recognixed.')

  TestStore6.first.test = 'dummy'
})

test('NGN.DATA.Store LIFO', function (t) {
  var TestModel7 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore7 = new NGN.DATA.Store({
    model: TestModel7,
    LIFO: 3
  })

  TestStore7.add({
    test: 'a'
  })

  TestStore7.add({
    test: 'd'
  })

  TestStore7.add({
    test: 'b'
  })

  TestStore7.on('record.create', function () {
    t.ok(TestStore7.first.test === 'a', 'First record untouched.')
    t.ok(TestStore7.last.test === 'c', 'Last record modified.')
    t.end()
  })

  TestStore7.add({
    test: 'c'
  })
})

test('NGN.DATA.Store FIFO', function (t) {
  var TestModel8 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore8 = new NGN.DATA.Store({
    model: TestModel8,
    FIFO: 3
  })

  TestStore8.add({
    test: 'a'
  })

  TestStore8.add({
    test: 'b'
  })

  TestStore8.add({
    test: 'c'
  })

  TestStore8.on('record.create', function () {
    t.ok(TestStore8.first.test === 'b', 'First record modified.')
    t.ok(TestStore8.last.test === 'd', 'Last record untouched.')
    t.end()
  })

  TestStore8.add({
    test: 'd'
  })
})

test('NGN.DATA.Store Max & Min Records', function (t) {
  var TestModel9 = new NGN.DATA.Model({
    fields: {
      test: {
        default: 'yo'
      }
    }
  })

  var TestStore9 = new NGN.DATA.Store({
    model: TestModel9,
    maxRecords: 3,
    minRecords: 2
  })

  TestStore9.add({
    test: 'a'
  })

  TestStore9.add({
    test: 'b'
  })

  TestStore9.add({
    test: 'c'
  })

  try {
    TestStore9.add({
      test: 'd'
    })
    t.fail('Maximum records exceeded.')
  } catch (e) {
    t.pass('Exceeding maximum records throws an error.')

    TestStore9.remove(0)

    try {
      TestStore9.remove(0)
      t.fail('Dropping below minimum record count does not throw an error.')
    } catch (ee) {
      t.pass('Dropping below minimum record count throws an error.')
      t.end()
    }
  }
})

test('Representative Data', function (t) {
  var Data = new NGN.DATA.Model({
    fields: {
      a: Number
    },
    virtuals: {
      b: function () {
        return this.a + 10
      }
    }
  })

  var d = new Data({
    a: 1
  })

  t.ok(d.representation.hasOwnProperty('b'), 'Virtual field recognized in model representation.')
  t.ok(d.representation.b === 11, 'Virtual field value is correct in model representation.')

  var DataSet = new NGN.DATA.Store({
    model: Data
  })

  DataSet.add(d)

  DataSet.add({
    a: 20
  })

  t.ok(DataSet.representation[1].hasOwnProperty('b'), 'Virtual field recognized in store representation.')
  t.ok(DataSet.representation[1].b === 30, 'Virtual field value is correct in store representation.')

  t.end()
})

test('Store Snapshots', function (t) {
  var Data = new NGN.DATA.Model({
    fields: {
      a: Number
    },
    virtuals: {
      b: function () {
        return this.a + 10
      }
    }
  })

  var DataSet = new NGN.DATA.Store({
    model: Data
  })

  DataSet.add({
    a: 1
  })

  DataSet.add({
    a: 2
  })

  var snapper
  DataSet.once('snapshot', function (ss) {
    t.pass('Snapshot event triggered.')
    t.ok(ss.hasOwnProperty('timestamp'), 'Snapshot has a timestamp.')
    t.ok(ss.hasOwnProperty('checksum') && typeof ss.checksum === 'string', 'Snapshot has a checksum.')
    t.ok(ss.hasOwnProperty('modelChecksums') && ss.modelChecksums.length === 2, 'Correct number of snapshot model checksums.')
    t.ok(ss.hasOwnProperty('data') &&
      ss.data.length === 2 &&
      ss.data[0].a === 1 &&
      ss.data[1].a === 2 &&
      !ss.data[0].hasOwnProperty('b'), 'Correct data stored without virtuals.')

    DataSet.once('snapshot', function () {
      t.ok(DataSet.snapshots.length === 2, 'Correct number of snapshots saved.')
      t.ok(DataSet.snapshots[0].data[0].a === 3 &&
        DataSet.snapshots[0].data[1].a === 2, 'Modified data stored when snapshot is taken at a later time.')
      t.end()
    })

    DataSet.first.a = 3
    DataSet.snapshot()
  })

  snapper = DataSet.snapshot()
  t.ok(typeof snapper === 'object', 'snapshot() returns the snapshot data.')
})

test('Silent Updates', function (t) {
  var Data = new NGN.DATA.Model({
    fields: {
      a: Number
    }
  })

  var test = new Data({
    a: 1
  })

  test.on('field.update', function () {
    t.fail('Update triggered an event.')
  })

  test.setSilent('a', 3)

  setTimeout(function () {
    t.ok(test.a === 3, 'Updated value without firing an event.')
    t.end()
  }, 600)
})

test('Proxying', function (t) {
  var Data = new NGN.DATA.Model({
    fields: {
      a: Number
    }
  })

  var record = new Data({
    a: 1
  })

  record.proxy = new NGN.DATA.Proxy()

  setTimeout(function () {
    t.ok(record.proxy instanceof NGN.DATA.Proxy, 'Proxy accessible as a model attribute.')
    t.ok(record.hasOwnProperty('url'), 'Proxy properties applied after model instantiation.')

    let store = new NGN.DATA.Store({
      model: Data
    })

    store.proxy = new NGN.DATA.Proxy()

    setTimeout(function () {
      t.ok(store.proxy instanceof NGN.DATA.Proxy, 'Proxy accessible as a model attribute.')
      t.ok(store.hasOwnProperty('url'), 'Proxy properties applied after model instantiation.')
      t.end()
    }, 300)
  }, 300)
})
