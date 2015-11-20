'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.Store
 * Represents a collection of data.
 */
window.NGN.DATA.Store = function (cfg) {
  cfg = cfg || {}

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
     */
    add: NGN.define(true, false, false, function (data) {
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
    }),

    /**
     * @method remove
     * Remove a record.
     * @param {NGN.DATA.Model|object|number} data
     * Accepts an existing NGN Data Model, JSON object,
     * or index number.
     */
    remove: NGN.define(true, false, false, function (data) {
      if (typeof data === 'number') {
        this._data.splice(data, 1)
      } else {
        this._data.splice(this._data.indexOf(data), 1)
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
    })
  })
}
