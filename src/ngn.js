window.NGN = {}

Object.defineProperty(window.NGN, 'define', {
  enumerable: false,
  writable: false,
  configurable: false,
  value: function (e, w, c, v) {
    return {
      enumerable: e,
      writable: w,
      configurable: c,
      value: v
    }
  }
})

Object.defineProperties(window.NGN, {
  _slice: NGN.define(false, false, false, function () {
    return Array.prototype.slice.call(arguments)
  }),
  _splice: NGN.define(false, false, false, function () {
    return Array.prototype.splice.call(arguments)
  }),
  _typeof: NGN.define(false, false, false, function (el) {
    return Object.prototype.toString.call(el).split(' ')[1].replace(/\]|\[/gi, '').toLowerCase()
  }),
  _od: NGN.define(false, false, false, function (obj, name, e, w, c, v) {
    Object.defineProperty(obj, name, NGN.define(e, w, c, v))
  }),
  _get: NGN.define(false, false, false, function (fn, enm) {
    enm = enm === undefined ? true : enm
    return {
      enumerable: enm,
      get: fn
    }
  })
})
