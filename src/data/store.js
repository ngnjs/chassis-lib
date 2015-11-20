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
    remove: NGN.define(true, false, false, function (data) {
      var removed = []
      if (typeof data === 'number') {
        removed = this._data.splice(data, 1)
      } else {
        removed = this._data.splice(this._data.indexOf(data), 1)
      }
      if (removed.length > 0) {
        NGN.emit('record.delete', removed[0])
      }
    }),

    /**
     * @method clear
     * Removes all records.
     * @fires clear
     * Fired when all records are removed
     */
    clear: NGN.define(true, false, false, function () {
      this._data = []
      NGN.emit('clear')
    }),

    /**
     * @property {array} records
     * The complete recordset
     * @readonly
     */
    records: NGN._get(function () {
      return this._data.map(function (d) {
        return d.record
      })
    }),

    /**
     * @property recordCount
     * The total number of #records in the collection.
     * @readonly
     */
    recordCount: NGN._get(function () {
      return this._data.length
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
     * @return {NGN.DATA.Model|array|null}
     * An array is returned when a function is specified for the query.
     * Otherwise the specific record is return. This method assumes
     * records have unique ID's.
     */
    find: NGN.define(true, false, false, function (query) {
      switch (typeof query) {
        case 'function':
          console.log(query)
          return this._data.filter(query)
        case 'number':
          if (query < 0 || query >= this._data.length) {
            return null
          }
          return this._data[query]
        case 'string':
          var r = this._data.filter(function (rec) {
            return (rec[rec.idAttribute] || '').toString().trim() === query.trim()
          })
          return r.length === 0 ? null : r[0]
        default:
          return this._data
      }
    })
  })
}
