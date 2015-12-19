'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.Store
 * Represents a collection of data.
 * @fires record.create
 * Fired when a new record is created. The new
 * record is provided as an argument to the event
 * handler.
 * @fires record.delete
 * Fired when a record(s) is removed. The old record
 * is provided as an argument to the event handler.
 */
window.NGN.DATA.Store = function (cfg) {
  cfg = cfg || {}

  var me = this

  Object.defineProperties(this, {
    /**
     * @cfg {NGN.DATA.Model} model
     * An NGN Data Model to which data records conform.
     */
    model: NGN.define(true, false, false, cfg.model || null),

    // The raw data collection
    _data: NGN.define(false, true, false, []),

    // The raw filters
    _filters: NGN.define(false, true, false, []),

    // The raw indexes
    _index: NGN.define(false, true, false, cfg.index || []),

    // Placeholders to track the data that's added/removed
    // during the lifespan of the store. Modified data is
    // tracked within each model record.
    _created: NGN.define(false, true, false, []),
    _deleted: NGN.define(false, true, false, []),
    _loading: NGN.define(false, true, false, false),

    /**
     * @property {NGN.DATA.Proxy} proxy
     * The proxy used to transmit data over a network.
     * @private
     */
    proxy: NGN.define(false, true, false, null),

    /**
     * @cfg {boolean} [allowDuplicates=true]
     * Set to `false` to prevent duplicate records from being added.
     * If a duplicate record is added, it will be ignored and an
     * error will be thrown.
     */
    allowDuplicates: NGN.define(true, true, false, NGN.coalesce(cfg.allowDuplicates, true)),

    eventListener: NGN.define(false, false, false, function (handler) {
      return function (rec) {
        if (rec.datastore && rec.datastore === me) {
          handler(rec)
        }
      }
    }),

    /**
     * @method on
     * Create an event handler
     * @param {string} eventName
     * Name of the event to handle.
     * @param {function} handler
     * The handler function that responds to the event.
     */
    on: NGN.define(true, false, false, function (topic, handler) {
      if (!NGN.BUS) {
        console.warn("NGN.DATA.Model.on('" + topic + "', ...) will not work because NGN.BUS is not available.")
        return
      }
      if (['record.create', 'record.delete', 'index.create', 'index.delete'].indexOf(topic) >= 0) {
        NGN.BUS.on(topic, this.eventListener(handler))
      } else {
        console.warn(topic + ' is not a supported NGN.DATA.Store event.')
      }
    }),

    /**
     * @property {array} filters
     * A list of the applied filters.
     * @readonly
     */
    /**
     * @method add
     * Add a data record.
     * @param {NGN.DATA.Model|object} data
     * Accepts an existing NGN Data Model or a JSON object.
     * If a JSON object is supplied, it will be applied to
     * the data model specified in cfg#model. If no model
     * is specified, the raw JSON data will be stored.
     * @param {boolean} [suppressEvent=false]
     * Set this to `true` to prevent the `record.create` event
     * from firing.
     */
    add: NGN.define(true, false, false, function (data, suppressEvent) {
      var rec
      if (!(data instanceof NGN.DATA.Entity)) {
        try { data = JSON.parse(data) } catch (e) {}
        if (typeof data !== 'object') {
          throw new Error('Cannot add a non-object record.')
        }
        if (this.model) {
          rec = new this.model(data) // eslint-disable-line new-cap
        } else {
          rec = data
        }
      } else {
        rec = data
      }
      if (rec.hasOwnProperty('_store')) {
        rec._store = me
      }
      if (!this.allowDuplicates && this._data.indexOf(rec) >= 0) {
        throw new Error('Cannot add duplicate record (allowDuplicates = false).')
      }
      this.listen(rec)
      this.applyIndices(rec, this._data.length)
      this._data.push(rec)
      !this._loading && this._created.indexOf(rec) < 0 && this._created.push(rec)
      !NGN.coalesce(suppressEvent, false) && NGN.emit('record.create', rec)
    }),

    /**
     * @method listen
     * Listen to a specific record's events and respond.
     * @param {NGN.DATA.Model} record
     * The record to listen to.
     * @private
     */
    listen: NGN.define(false, false, false, function (record) {
      record.on('field.update', function (delta) {
        me.updateIndice(delta.field, delta.old, delta.new, me._data.indexOf(record))
      })
      record.on('field.delete', function (delta) {
        me.updateIndice(delta.field, delta.old, undefined, me._data.indexOf(record))
      })
    }),

    /**
     * @method bulk
     * Bulk load data.
     * @param {string} eventName
     * @param {array} data
     * @private
     */
    bulk: NGN.define(true, false, false, function (event, data) {
      this._loading = true
      data.forEach(function (rec) {
        me.add(rec, true)
      })
      this._loading = false
      this._deleted = []
      this._created = []
      NGN.emit(event || 'load')
    }),

    /**
     * @method load
     * Bulk load data. This acts the same as adding records,
     * but it suppresses individual record creation events.
     * This will add data to the existing collection. If you
     * want to load fresh data, use the #reload method.
     * @param {array} data
     * An array of data. Each array element should be an
     * NGN.DATA.Model or a JSON object that can be applied
     * to the store's #model.
     */
    load: NGN.define(true, false, false, function () {
      this.bulk('load', NGN._slice(arguments))
    }),

    /**
     * @method reload
     * Reload data. This is the same as running #clear followed
     * by #load.
     */
    reload: NGN.define(true, false, false, function (data) {
      this.clear()
      this.bulk('reload', NGN._slice(arguments))
    }),

    /**
     * @method remove
     * Remove a record.
     * @param {NGN.DATA.Model|object|number} data
     * Accepts an existing NGN Data Model, JSON object,
     * or index number.
     */
    remove: NGN.define(true, false, false, function (data, suppressEvents) {
      var removed = []
      var num
      if (typeof data === 'number') {
        num = data
      } else {
        num = this._data.indexOf(data)
      }
      removed = this._data.splice(num, 1)
      if (removed.length > 0) {
        this.unapplyIndices(num)
        if (!this._loading) {
          var i = this._created.indexOf(removed[0])
          if (i >= 0) {
            i >= 0 && this._created.splice(i, 1)
          } else if (this._deleted.indexOf(removed[0]) < 0) {
            this._deleted.push(removed[0])
          }
        }
        !NGN.coalesce(suppressEvents, false) && NGN.emit('record.delete', removed[0])
      }
    }),

    /**
     * @method clear
     * Removes all data.
     * @fires clear
     * Fired when all data is removed
     */
    clear: NGN.define(true, false, false, function () {
      this._data = []
      Object.keys(this._index).forEach(function (index) {
        me._index[index] = []
      })
      NGN.emit('clear')
    }),

    /**
     * @property {array} data
     * The complete and unfiltered raw recordset. This data
     * is usually persisted to a database.
     * @readonly
     */
    data: NGN._get(function () {
      return this._data.map(function (d) {
        return d.data
      })
    }),

    /**
     * @property {array} records
     * An array of NGN.DATA.Model records. If the store has
     * filters applied, the results will reflect the filtration.
     * @readonly
     */
    records: NGN._get(function () {
      return this.applyFilters(this._data)
    }),

    /**
     * @property recordCount
     * The total number of #records in the collection.
     * @readonly
     */
    recordCount: NGN._get(function () {
      return this.applyFilters(this._data).length
    }),

    /**
     * @method find
     * Retrieve a specific record or set of records.
     * @param {number|function|string|object} [query=null]
     * When this is set to a `number`, the corresponding zero-based
     * record will be returned. A `function` can also be used, which
     * acts like a filter. Each record is passed to this function.
     *
     * For example, if we want to find all administrators within a
     * set of users, the following could be used:
     *
     * ```js
     *   var record = MyStore.find(function (record) {
     *     return record.usertype = 'admin'
     *   })
     * ```
     *
     * It's also possible to supply a String. When this is supplied,
     * the store will look for a record whose ID (see NGN.DATA.Model#idAttribute)
     * matches the string. Numberic ID's are matched on their string
     * equivalent for search purposes (data is not modified).
     *
     * An object can be used to search for specific field values. For example:
     *
     * ```js
     * MyStore.find({
     *   firstname: 'Corey',
     *   lastname: /Butler|Doe/
     * })
     * ```
     *
     * The code above will find everyone named Corey Butler or Corey Doe. The
     * first attribute must match the value exactly whereas `lastname` will
     * match against the regular expression.
     *
     * If this parameter is `undefined` or `null`, all records will be
     * returned (i.e. no search criteria specified, so return everything).
     *
     * If you're using a large dataset, indexing can speed up queries. To take
     * full advantage of indexing, all of the query elements should be indexed.
     * For example, if you have `lastname`, 'firstname' in your query and
     * both of those are indexed, the response time will be substantially faster
     * than if they're not (in large data sets). However; if one of those
     * elements is _not_ indexed, performance may not increase.
     * @param {boolean} [ignoreFilters=false]
     * Set this to `true` to search the full unfiltered record set.
     * @return {NGN.DATA.Model|array|null}
     * An array is returned when a function is specified for the query.
     * Otherwise the specific record is return. This method assumes
     * records have unique ID's.
     */
    find: NGN.define(true, false, false, function (query, ignoreFilters) {
      if (this._data.length === 0) {
        return []
      }
      var res = []
      switch (typeof query) {
        case 'function':
          res = this._data.filter(query)
          break
        case 'number':
          res = (query < 0 || query >= this._data.length) ? null : this._data[query]
          break
        case 'string':
          var i = this.getIndices(this._data[0].idAttribute, query.trim())
          if (i !== null && i.length > 0) {
            i.forEach(function (index) {
              res.push(me._data[index])
            })
            return res
          }
          var r = this._data.filter(function (rec) {
            return (rec[rec.idAttribute] || '').toString().trim() === query.trim()
          })
          res = r.length === 0 ? null : r[0]
          break
        case 'object':
          var match = []
          var noindex = []
          var keys = Object.keys(query)
          keys.forEach(function (field) {
            var index = me.getIndices(field, query[field])
            if (index) {
              match = match.concat(index || [])
            } else {
              field !== null && noindex.push(field)
            }
          })
          // Deduplicate
          match.filter(function (index, i) {
            return match.indexOf(index) === i
          })

          // Get non-indexed matches
          if (noindex.length > 0) {
            res = this._data.filter(function (record, i) {
              if (match.indexOf(i) >= 0) {
                return false
              }
              for (var x = 0; x < noindex.length; x++) {
                if (record[noindex[x]] !== query[noindex[x]]) {
                  return false
                }
              }
              return true
            })
          }
          // If a combined indexable + nonindexable query
          res = res.concat(match.map(function (index) {
            return me._data[index]
          })).filter(function (record) {
            for (var y = 0; y < keys.length; y++) {
              if (query[keys[y]] !== record[keys[y]]) {
                return false
              }
            }
            return true
          })
          break
        default:
          res = this._data
      }
      if (res === null) {
        return null
      }
      !NGN.coalesce(ignoreFilters, false) && this.applyFilters(res instanceof Array ? res : [res])
      return res
    }),

    /**
     * @method applyFilters
     * Apply filters to a data set.
     * @param {array} data
     * The array of data to apply filters to.
     * @private
     */
    applyFilters: NGN.define(false, false, false, function (data) {
      if (this._filters.length === 0) {
        return data
      }
      this._filters.forEach(function (filter) {
        data = data.filter(filter)
      })
      return data
    }),

    /**
     * @method addFilter
     * Add a filter to the record set.
     * @param {function} fn
     * The filter function. This function should comply
     * with the [Array.filter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) specification,
     * returning a boolean value.
     * The item passed to the filter will be the NGN.DATA.Model specified
     * in the cfg#model.
     * @fires filter.create
     * Fired when a filter is created.
     */
    addFilter: NGN.define(true, false, false, function (fn) {
      this._filters.push(fn)
      NGN.emit('filter.create', fn)
    }),

    /**
     * @method removeFilter
     * Remove a filter from the record set.
     * @param {function|index} filter
     * This can be the function which was originally passed to
     * the #addFilter method, or the zero-based #filters index
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing one the creation of the filter.
     * @fires filter.delete
     * Fired when a filter is removed.
     */
    removeFilter: NGN.define(true, false, false, function (fn, suppressEvents) {
      suppressEvents = NGN.coalesce(suppressEvents, false)
      var removed = []
      if (typeof fn === 'number') {
        removed = this._filters.splice(fn, 1)
      } else {
        removed = this._filters.splice(this._filters.indexOf(fn), 1)
      }
      removed.length > 0 && !suppressEvents && NGN.emit('filter.delete', removed[0])
    }),

    /**
     * @method clearFilters
     * Remove all filters.
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing one the removal of each filter.
     */
    clearFilters: NGN.define(true, false, false, function (suppressEvents) {
      suppressEvents = NGN.coalesce(suppressEvents, false)
      if (suppressEvents) {
        this._filters = []
        return
      }
      while (this._filters.length > 0) {
        NGN.emit('filter.remove', this._filters.pop())
      }
    }),

    /**
     * @method deduplicate
     * Deduplicates the recordset. This compares the checksum of
     * each of the records to each other and removes duplicates.
     * This suppresses the removal
     * @param {boolean} [suppressEvents=true]
     * Suppress the event that gets fired when a record is removed.
     */
    deduplicate: NGN.define(true, false, false, function (suppressEvents) {
      suppressEvents = NGN.coalesce(suppressEvents, true)
      var records = this.data.map(function (rec) {
        return JSON.stringify(rec)
      })
      var dupes = []
      records.forEach(function (record, i) {
        if (records.indexOf(record) < i) {
          dupes.push(me.find(i))
        }
      })
      dupes.forEach(function (duplicate) {
        me.remove(duplicate)
      })
    }),

    /**
     * @method sort
     * Sort the #records. This forces a #reindex, which may potentially be
     * an expensive operation on large data sets.
     * @param {function|object} sorter
     * Using a function is exactly the same as using the
     * [Array.sort()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort?redirectlocale=en-US&redirectslug=JavaScript%2FReference%2FGlobal_Objects%2FArray%2Fsort) method
     * (this is the compare function). The arguments passed to the
     * method are NGN.DATA.Model objects.
     * Alternatively, it is possible to sort by one or more model
     * attributes. Each attribute For example:
     *
     * ```js
     * var Person = new NGN.DATA.Model({
     *   fields: {
     *     fname: null,
     *     lname: null
     *   }
     * })
     *
     * var People = new NGN.DATA.Store({
     *   model: Person
     * })
     *
     * People.add({
     *   fname: 'John',
     *   lname: 'Doe',
     *   age: 37
     * }, {
     *   fname: 'Jane',
     *   lname: 'Doe',
     *   age: 36
     * }, {
     *   fname: 'Jane',
     *   lname: 'Vaughn',
     *   age: 42
     * })
     *
     * People.sort({
     *   lname: 'asc',  // Sort by last name in normal alphabetical order.
     *   age: 'desc'    // Sort by age, oldest to youngest.
     * })
     *
     * People.records.forEach(function (p) {
     *   console.log(fname, lname, age)
     * })
     *
     * // DISPLAYS
     * // John Doe 37
     * // Jane Doe 36
     * // Jane Vaughn 42
     *
     * People.sort({
     *   age: 'desc',  // Sort by age, oldest to youngest.
     *   lname: 'asc'  // Sort by name in normal alphabetical order.
     * })
     *
     * People.records.forEach(function (p) {
     *   console.log(fname, lname, age)
     * })
     *
     * // DISPLAYS
     * // Jane Vaughn 42
     * // John Doe 37
     * // Jane Doe 36
     * ```
     *
     * It is also posible to provide complex sorters. For example:
     *
     * ```js
     * People.sort({
     *   lname: 'asc',
     *   age: function (a, b) {
     *     if (a.age < 40) {
     *       return 1
     *     }
     *     return a.age < b.age
     *   }
     * })
     * ```
     *
     * The sorter above says "sort alphabetically by last name,
     * then by age where anyone under 40yrs old shows up before
     * everyone else, but sort the remainder ages in descending order.
     */
    sort: NGN.define(true, false, false, function (fn) {
      if (typeof fn === 'function') {
        this.records.sort(fn)
      } else if (typeof fn === 'object') {
        var keys = Object.keys(fn)
        this.records.sort(function (a, b) {
          for (var i = 0; i < keys.length; i++) {
            // Make sure both objects have the same sorting key
            if (a.hasOwnProperty(keys[i]) && !b.hasOwnProperty(keys[i])) {
              return 1
            }
            if (!a.hasOwnProperty(keys[i]) && b.hasOwnProperty(keys[i])) {
              return -1
            }
            // For objects who have the key, sort in the order defined in object.
            if (a[keys[i]] !== b[keys[i]]) {
              switch (fn[keys[i]].toString().trim().toLowerCase()) {
                case 'asc':
                  return a[keys[i]] > b[keys[i]] ? 1 : -1
                case 'desc':
                  return a[keys[i]] < b[keys[i]] ? 1 : -1
                default:
                  if (typeof fn[keys[i]] === 'function') {
                    return fn[keys[i]](a, b)
                  }
                  return 0
              }
            }
          }
          // Everything is equal
          return 0
        })
      }
      this.reindex()
    }),

    /**
     * @method createIndex
     * Add a simple index to the recordset.
     * @param {string} datafield
     * The #model data field to index.
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing on the creation of the index.
     * @fires index.create
     * Fired when an index is created. The datafield name and
     * store are supplied as an argument to event handlers.
     */
    createIndex: NGN.define(true, false, false, function (field, suppressEvents) {
      if (!this.model.hasOwnProperty(field)) {
        console.warn("The store's model does not contain a data field called " + field + '.')
      }
      var exists = this._index.hasOwnProperty(field)
      this._index[field] = this._index[field] || []
      !NGN.coalesce(suppressEvents, false) && !exists && NGN.emit('index.created', {field: field, store: me})
    }),

    /**
     * @method deleteIndex
     * Remove an index.
     * @param {string} datafield
     * The #model data field to stop indexing.
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing on the removal of the index.
     * @fires index.delete
     * Fired when an index is deleted. The datafield name and
     * store are supplied as an argument to event handlers.
     */
    deleteIndex: NGN.define(true, false, false, function (field, suppressEvents) {
      if (this._index.hasOwnProperty(field)) {
        delete this._index[field]
        !NGN.coalesce(suppressEvents, false) && NGN.emit('index.created', {field: field, store: me})
      }
    }),

    /**
     * @method clearIndices
     * Clear all indices from the indexes.
     */
    clearIndices: NGN.define(false, false, false, function () {
      Object.keys(this._index).forEach(function (key) {
        me._index[key] = []
      })
    }),

    /**
     * @method deleteIndexes
     * Remove all indexes.
     * @param {boolean} [suppressEvents=true]
     * Prevent events from firing on the removal of each index.
     */
    deleteIndexes: NGN.define(true, false, false, function (suppressEvents) {
      suppressEvents = NGN.coalesce(suppressEvents, true)
      Object.keys(this._index).forEach(function (key) {
        me.deleteIndex(key, suppressEvents)
      })
    }),

    /**
     * @method applyIndices
     * Apply the values to the index.
     * @param {NGN.DATA.Model} record
     * The record which should be applied to the index.
     * @param {number} number
     * The record index number.
     * @private
     */
    applyIndices: NGN.define(false, false, false, function (record, num) {
      var indexes = Object.keys(this._index)
      if (indexes.length === 0) {
        return
      }
      indexes.forEach(function (field) {
        if (record.hasOwnProperty(field)) {
          var values = me._index[field]
          // Check existing records for similar values
          for (var i = 0; i < values.length; i++) {
            if (values[i][0] === record[field]) {
              me._index[field][i].push(num)
              return
            }
          }
          // No matching words, create a new one.
          me._index[field].push([record[field], num])
        }
      })
    }),

    /**
     * @method unapplyIndices
     * This removes a record from all relevant indexes simultaneously.
     * Commonly used when removing a record from the store.
     * @param  {number} indexNumber
     * The record index.
     * @private
     */
    unapplyIndices: NGN.define(false, false, false, function (num) {
      Object.keys(this._index).forEach(function (field) {
        var i = me._index[field].indexOf(num)
        if (i >= 0) {
          me._index[field].splice(i, 1)
        }
      })
    }),

    /**
     * @method updateIndice
     * Update the index with new values.
     * @param  {string} fieldname
     * The name of the indexed field.
     * @param  {any} oldValue
     * The original value. This is used to remove the old value from the index.
     * @param  {any} newValue
     * The new value.
     * @param  {number} indexNumber
     * The number of the record index.
     * @private
     */
    updateIndice: NGN.define(false, false, false, function (field, oldValue, newValue, num) {
      if (!this._index.hasOwnProperty(field) || oldValue === newValue) {
        return
      }
      var ct = 0
      for (var i = 0; i < me._index[field].length; i++) {
        var value = me._index[field][i][0]
        if (value === oldValue) {
          me._index[field][i].splice(me._index[field][i].indexOf(num), 1)
          ct++
        } else if (newValue === undefined) {
          // If thr new value is undefined, the field was removed for the record.
          // This can be skipped.
          ct++
        } else if (value === newValue) {
          me._index[field][i].push(num)
          me._index[field][i].shift()
          me._index[field][i].sort()
          me._index[field][i].unshift(value)
          ct++
        }
        if (ct === 2) {
          return
        }
      }
    }),

    /**
     * @method getIndices
     * Retrieve a list of index numbers pertaining to a field value.
     * @param  {string} field
     * Name of the data field.
     * @param  {any} value
     * The value of the index to match against.
     * @return {array}
     * Returns an array of integers representing the index where the
     * values exist in the record set.
     */
    getIndices: NGN.define(false, false, false, function (field, value) {
      if (!this._index.hasOwnProperty(field)) {
        return null
      }
      var indexes = this._index[field].filter(function (dataarray) {
        return dataarray.length > 0 && dataarray[0] === value
      })
      if (indexes.length === 1) {
        indexes[0].shift()
        return indexes[0]
      }
      return []
    }),

    /**
     * @method reindex
     * Reindex the entire record set. This can be expensive operation.
     * Use with caution.
     * @private
     */
    reindex: NGN.define(false, false, false, function () {
      this.clearIndices()
      this._data.forEach(function (rec, i) {
        me.applyIndices(rec, i)
      })
    })
  })

  // Convert index to object
  if (!NGN.BUS && this._index.length > 0) {
    console.warn('Indexing will not work for record updates because NGN.BUS cannot be found.')
  }
  var obj = {}
  this._index.forEach(function (i) {
    obj[i] = []
  })
  this._index = obj
}

NGN.DATA.util.inherit(NGN.DATA.util.EventEmitter, NGN.DATA.Store)

/**
 * indexes
 * An index consists of an object whose key is name of the
 * data field being indexed. The value is an array of record values
 * and their corresponding index numbers. For example:
 *
 * ```js
 * {
 *   "lastname": [["Butler", 0, 1, 3], ["Doe", 2, 4]]
 * }
 * ```
 * The above example indicates the store has two unique `lastname`
 * values, "Butler" and "Doe". Records containing a `lastname` of
 * "Butler" exist in the record store as the first, 2nd, and 4th
 * records. Records with the last name "Doe" are 3rd and 5th.
 * Remember indexes are zero based since records are stored as an
 * array.
 */
