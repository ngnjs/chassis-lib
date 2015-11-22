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
      suppressEvent = NGN.coalesce(suppressEvent, false)

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
      this.applyIndexes(rec)
      this._data.push(rec)
      !suppressEvent && NGN.emit('record.create', rec)
    }),

    /**
     * @method bulk
     * Bulk load data.
     * @param {string} eventName
     * @param {array} data
     * @private
     */
    bulk: NGN.define(true, false, false, function (event, data) {
      data.forEach(function (rec) {
        me.add(rec, true)
      })
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
      suppressEvents = NGN.coalesce(suppressEvents, false)
      var removed = []
      if (typeof data === 'number') {
        removed = this._data.splice(data, 1)
      } else {
        removed = this._data.splice(this._data.indexOf(data), 1)
      }
      if (removed.length > 0 && !suppressEvents) {
        NGN.emit('record.delete', removed[0])
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
     * @param {number|function|string} [query=null]
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
     * If this parameter is `undefined` or `null`, all records will be
     * returned (i.e. no search criteria specified, so return everything).
     * @param {boolean} [ignoreFilters=false]
     * Set this to `true` to search the full unfiltered record set.
     * @return {NGN.DATA.Model|array|null}
     * An array is returned when a function is specified for the query.
     * Otherwise the specific record is return. This method assumes
     * records have unique ID's.
     */
    find: NGN.define(true, false, false, function (query, ignoreFilters) {
      var res
      switch (typeof query) {
        case 'function':
          res = this._data.filter(query)
          break
        case 'number':
          res = (query < 0 || query >= this._data.length) ? null : this._data[query]
          break
        case 'string':
          var r = this._data.filter(function (rec) {
            return (rec[rec.idAttribute] || '').toString().trim() === query.trim()
          })
          res = r.length === 0 ? null : r[0]
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
     * Sort the #records.
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
                  return a[keys[i]] > b[keys[i]]
                case 'desc':
                  return a[keys[i]] < b[keys[i]]
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
    }),

    /**
     * @method createIndex
     * Add a simple index to the recordset.
     * @param {string} datafield
     * The #model data field to index.
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing on the creation of the index.
     * @fires index.create
     * Fired when an index is created. The datafield name is supplied
     * as an argument to event handlers.
     */
    createIndex: NGN.define(true, false, false, function (field, suppressEvents) {
      if (!this.model.hasOwnProperty(field)) {
        console.warn("The store's model does not contain a data field called " + field + '.')
      }
      var exists = this._index.hasOwnProperty(field)
      this._index[field] = this._index[field] || []
      !NGN.coalesce(suppressEvents, false) && !exists && NGN.emit('index.created', field)
    }),

    /**
     * @method deleteIndex
     * Remove an index.
     * @param {string} datafield
     * The #model data field to stop indexing.
     * @param {boolean} [suppressEvents=false]
     * Prevent events from firing on the removal of the index.
     * @fires index.delete
     * Fired when an index is deleted. The datafield name is supplied
     * as an argument to event handlers.
     */
    deleteIndex: NGN.define(true, false, false, function (field, suppressEvents) {
      if (this._index.hasOwnProperty(field)) {
        delete this._index[field]
        !NGN.coalesce(suppressEvents, false) && NGN.emit('index.created', field)
      }
    }),

    /**
     * @method clearIndexes
     * Remove all indexes.
     * @param {boolean} [suppressEvents=true]
     * Prevent events from firing on the removal of each index.
     */
    clearIndexes: NGN.define(true, false, false, function (suppressEvents) {
      suppressEvents = NGN.coalesce(suppressEvents, true)
      Object.keys(this._index).forEach(function (key) {
        me.deleteIndex(key, suppressEvents)
      })
    }),

    /**
     * @method applyIndexes
     * @param {NGN.DATA.Model} record
     * The record which should be applied to the index.
     * @param {number} number
     * The record index number.
     * @private
     */
    applyIndexes: NGN.define(false, false, false, function (record, num) {
      var indexes = Object.keys(this._index)
      if (indexes.length === 0) {
        return
      }
      indexes.forEach(function (field) {
        if (record.hasOwnProperty(field)) {
          var values = me._index[field]
          // Check existing records for similar values
          for (var i = 0; i < values.length; i++) {
            if (values[i] === record[field]) {
              me._index[field].push(num)
              break
            }
          }
          // No matching words, create a new one.
          me._index[field] = [record[field], num]
        }
      })
    }),

    /**
     * @method getIndexes
     * Retrieve a list of index numbers pertaining to a field value.
     * @param  {string} field
     * Name of the data field.
     * @param  {any} value
     * The value of the index to match against.
     * @return {array}
     * Returns an array of integers representing the index where the
     * values exist in the record set.
     */
    getIndexes: NGN.define(false, false, false, function (field, value) {
      var indexes = this._index[field].filter(function (dataarray) {
        return dataarray.length > 0 && dataarray[0] === value
      })
      if (indexes.length === 1) {
        indexes[0].shift()
        return indexes[0]
      }
      return []
    })
  })

  // Convert index to object
  var obj = {}
  this._index.forEach(function (i) {
    obj[me._index[i]] = []
  })
}

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
