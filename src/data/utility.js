'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}
window.NGN.DATA.util = {}

/**
 * @class NGN.DATA.util
 * A utility class.
 * @singleton
 */
Object.defineProperties(window.NGN.DATA.util, {
  // CRC table for checksum (cached)
  crcTable: NGN.define(false, true, false, null),

  /**
   * @method makeCRCTable
   * Generate the CRC table for checksums. This is a fairly complex
   * operation that should only be executed once and cached for
   * repeat use.
   * @private
   */
  makeCRCTable: NGN.define(false, false, false, function () {
    var c
    var crcTable = []
    for (var n = 0; n < 256; n++) {
      c = n
      for (var k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
      }
      crcTable[n] = c
    }
    return crcTable
  }),

  /**
   * @method checksum
   * Create the checksum of the specified string.
   * @param  {string} content
   * The content to generate a checksum for.
   * @return {string}
   * Generates a checksum value.
   */
  checksum: NGN.define(true, false, false, function (str) {
    var crcTable = this.crcTable || (this.crcTable = this.makeCRCTable())
    var crc = 0 ^ (-1)

    for (var i = 0; i < str.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
    }

    return (crc ^ (-1)) >>> 0
  }),

  /**
   * @method inherit
   * Inherit the properties of another object/class.
   * @param  {object|function} source
   * The source object (i.e. what gets copied)
   * @param  {object|function} destination
   * The object properties get copied to.
   */
  inherit: NGN.define(true, false, false, function (source, dest) {
    source = typeof source === 'function' ? source.prototype : source
    dest = typeof dest === 'function' ? dest.prototype : dest
    Object.getOwnPropertyNames(source).forEach(function (attr) {
      var content = source[attr]
      dest[attr] = content
    })
  }),

  /**
   * @method GUID
   * Generate  a globally unique identifier.
   *
   * This is a "fast" GUID generator, designed to work in the browser.
   * The likelihood of an ID collision is 1:3.26x10^15 (1 in 3.26 Quadrillion),
   * and it will generate the ID between approximately 105ms (Desktop) and 726ms
   * (Android) as of May 2016. This code came from StackOverflow, courtesy of
   * an answer from Jeff Ward.
   * @return {string}
   * Returns a V4 GUID.
   */
  GUID: NGN.define(true, false, false, function () {
    var lut = []
    for (var i = 0; i < 256; i++) {
      lut[i] = (i < 16 ? '0' : '') + (i).toString(16)
    }

    var d0 = Math.random() * 0xffffffff | 0
    var d1 = Math.random() * 0xffffffff | 0
    var d2 = Math.random() * 0xffffffff | 0
    var d3 = Math.random() * 0xffffffff | 0

    return lut[d0 & 0xff] + lut[d0 >> 8 & 0xff] + lut[d0 >> 16 & 0xff] + lut[d0 >> 24 & 0xff] +
      '-' + lut[d1 & 0xff] + lut[d1 >> 8 & 0xff] + '-' + lut[d1 >> 16 & 0x0f | 0x40] +
      lut[d1 >> 24 & 0xff] + '-' + lut[d2 & 0x3f | 0x80] + lut[d2 >> 8 & 0xff] + '-' +
      lut[d2 >> 16 & 0xff] + lut[d2 >> 24 & 0xff] + lut[d3 & 0xff] + lut[d3 >> 8 & 0xff] +
      lut[d3 >> 16 & 0xff] + lut[d3 >> 24 & 0xff]
  }),

  EventEmitter: NGN.define(true, false, false, {})
})

/**
 * @class NGN.DATA.util.EventEmitter
 * A rudimentary event emitter.
 */
Object.defineProperties(NGN.DATA.util.EventEmitter, {
  // Holds the event handlers
  _events: NGN.define(false, true, false, {}),

  /**
   * @method on
   * Listen to this model for events. This is used by the NGN.DATA.Store.
   * It can be used for other purposes, but it may change over time to
   * suit the needs of the data store. It is better to use the NGN.BUS
   * for handling model events in applications.
   * @param  {string} eventName
   * The name of the event to listen for.
   * @param {function} handler
   * A method to respond to the event with.
   * @private
   */
  on: NGN.define(false, false, false, function (event, fn) {
    this._events[event] = this._events[event] || []
    this._events[event].push(fn)
  }),

  /**
   * @method off
   * Remove an event listener.
   * @param  {string} eventName
   * The name of the event to remove the listener from.
   * @param {function} handler
   * The method used to respond to the event.
   * @private
   */
  off: NGN.define(false, false, false, function (event, fn) {
    var b = this._events[event].indexOf(fn)
    if (b < 0) { return }
    this._events[event].splice(b, 1)
    if (this._events[event].length === 0) {
      delete this._events[event]
    }
  }),

  /**
   * @method fire
   * Fire a private event.
   * @param  {string} eventName
   * Name of the event
   * @param {any} [payload]
   * An optional payload to deliver to the event handler.
   */
  emit: NGN.define(false, false, false, function (event, payload) {
    if (this._events.hasOwnProperty(event)) {
      this._events[event].forEach(function (fn) {
        fn(payload)
      })
    }
    NGN.emit(event, payload)
  })
})
