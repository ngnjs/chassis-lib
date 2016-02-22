/**
 * @class NGN
 * @singleton
 */
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
  _slice: NGN.define(false, false, false, function (o) {
    return Array.prototype.slice.call(o)
  }),
  _splice: NGN.define(false, false, false, function (o) {
    return Array.prototype.splice.call(o)
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
  }),
  /*
   * @method coalesce
   * Finds the first non-null/defined value in a list of arguments.
   * This can be used with {@link Boolean Boolean} values, since `true`/`false` is a
   * non-null/defined value.
   * @param {Mixed} args
   * Any number of arguments can be passed to this method.
   */
  coalesce: NGN.define(true, false, false, function () {
    for (var i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined) {
        if (NGN._typeof(arguments[i]) !== 'null') {
          return arguments[i]
        }
      }
    }
    // No values? Return null
    return null
  }),

  /**
   * @method emit
   * A helper method for Chassis components that require event emission. If
   * the NGN BUS is not used, events are translated to console output.
   */
  emit: NGN.define(false, false, false, function (topic) {
    if (NGN.BUS) {
      NGN.BUS.emit.apply(NGN.BUS, arguments)
    } else {
      console.info(topic)
    }
  }),
  nodelike: {
    get: function () {
      var _nodeish_env = false
      try {
        _nodeish_env = require !== undefined
      } catch (e) {}
      return _nodeish_env
    }
  }
})

// Force scope
document.body.classList.add('ngn')

// If web components are used, prevent FOUC
// This is a hack to support polyfilled web components. This will be removed
// when the W3C web components spec is adopted by major browser vendors.
if (window.hasOwnProperty('WebComponents')) {
  document.body.style.opacity = 0
  window.addEventListener('WebComponentsReady', function () {
    setTimeout(function () {
      document.body.style.opacity = 0
    }, 50)
  })
}
