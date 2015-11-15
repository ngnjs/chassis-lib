/**
 * @class NGN.ref
 * A global "pointer" to DOM elements. This is used to reference and manipulate
 * DOM elements in a simple and standard way, without restricting native functionality.
 */
'use strict'

window.NGN.ref = new function () {
  var requireBUS = function (trigger, event, scope, nm) {
    if (NGN.BUS === undefined) {
      return console.error('The event BUS is required for ' + nm + '().')
    }
    var fn = function (e) {
      NGN.BUS.emit(event, e)
    }
    scope.addEventListener(trigger, fn)
  }

  var qs = function (value, selector, all) {
    if (typeof value === 'string') {
      return document[all ? 'querySelector' : 'querySelectorAll']((value + ' > ' + selector).trim())
    }
    return value[all ? 'querySelector' : 'querySelectorAll'](selector.trim())
  }

  Object.defineProperties(this, {

    keys: NGN.define(false, true, false, {}),

    _find: NGN.define(false, false, false, function (value, selector) {
      if (typeof value === 'string') {
        var reference = window.NGN.ref.find((value + ' > ' + selector).trim())
        if (reference.length === 0) {
          var tmpref = window.NGN.ref.find((value).trim())[0].parentNode.querySelectorAll(selector)
          if (tmpref.length > 0) {
            if (tmpref.length === 1) {
              return tmpref[0]
            }
            return tmpref
          }
        }
        return reference
      }
      return window.NGN.ref.find(value.querySelectorAll(selector))
    }),

    /**
     * @method find
     * Retrieve the DOM element(s) for the given selector. This method provides
     * an **unmanaged** reference object.
     * @private
     * @param {String} selector
     * The selector (CSS-style).
     * @returns {ref}
     * Returns an instance of the reference.
     */
    find: NGN.define(false, false, false, function (value) {
      var html = typeof value !== 'string'
      var els = html === false ? document.querySelectorAll(value) : value
      var result = null

      if (els.length === 1) {
        if (!els[0].hasOwnProperty('isArray')) {
          Object.defineProperties(els[0], {
            isArray: NGN._get(function () {
              return false
            }, false)
          })
        }

        if (!els[0].hasOwnProperty('find')) {
          NGN._od(els[0], 'find', true, false, false, function (selector) {
            return window.NGN.ref._find(value, selector)
          })
        }

        if (!els[0].hasOwnProperty('forward')) {
          NGN._od(els[0], 'forward', true, false, false, function (trigger, event) {
            requireBUS(trigger, event, this, 'forward')
          })
        }
        result = els[0]
      } else {
        var base = NGN._slice(els)

        // Apply querySelector/All to the response for chaining.
        Object.defineProperties(base, {
          querySelector: NGN.define(false, false, false, function (selector) {
            qs(value, selector)
          }),

          querySelectorAll: NGN.define(false, false, false, function (selector) {
            qs(value, selector, true)
          }),

          addEventListener: NGN.define(false, false, false, function (evt, fn) {
            this.forEach(function (el) {
              el.addEventListener(evt, fn)
            })
          }),

          removeEventListener: NGN.define(false, false, false, function (evt, fn) {
            this.forEach(function (el) {
              el.removeEventListener(evt, fn)
            })
          }),

          find: NGN.define(true, false, false, function (selector) {
            return window.NGN.ref._find(value, selector)
          }),

          isArray: NGN._get(function () {
            return true
          }, false),

          forward: NGN.define(false, false, false, function (trigger, event) {
            requireBUS(trigger, event, this, 'forward')
          })
        })
        result = base
      }

      return result
    }),

    /**
     * @method create
     * Add a reference.
     * @param {String} [key]
     * The key/name of the reference. For example, if this is `myElement`,
     * then `ref.myElement` will return a pointer to this reference.
     * @param {string} selector
     * The CSS selector path.
     */
    create: {
      enumerble: true,
      writable: false,
      configurable: false,
      value: function (key, value) {
        // If the key is not provided but the value is a DOM element, make
        // an ephemeral reference.
        if (!value && typeof key !== 'string') {
          return this.find(key)
        }

        // Basic error checking
        if (typeof key !== 'string' && typeof key !== 'number') {
          throw new Error('Cannot add a non-alphanumeric selector reference.')
        }
        if (key.trim().length === 0) {
          throw new Error('Cannot add a blank selector reference.')
        }
        if (value === undefined || value === null || value.trim().length === 0) {
          throw new Error('Cannot create a null/undefined selector reference.')
        }

        // Create a reference object
        var cleankey = this.cleanKey(key)
        var me = this
        NGN._od(window.NGN.ref, cleankey, false, true, true, value)

        Object.defineProperty(window.NGN.ref, key, {
          enumerable: true,
          get: function () {
            return me.find(value)
          },
          set: function (val) {
            if (val === undefined || val === null || val.trim().length === 0) {
              throw new Error('Cannot create a null/undefined selector reference.')
            }
            window.NGN.ref[cleankey] = val
          }
        })

        this.keys[key] = value
        this.keys[this.cleanKey(key)] = value
      }
    },

    /**
     * @method remove
     * Removes a key from the reference manager.
     */
    remove: NGN.define(true, false, false, function (key) {
      if (this.key) {
        delete this.key
        delete this.keys[key]
      }
      var ck = this.cleanKey(key)
      if (this[ck]) {
        delete this[ck]
        delete this.keys[ck]
      }
    }),

    /**
     * @method cleanKey
     * Creates a clean version of the key used to uniquely identify the reference.
     * @private
     * @param {String} key
     * The key to clean.
     */
    cleanKey: NGN.define(false, false, false, function (key) {
      return key.replace(/[^A-Za-z0-9\_\#\$\@\-\+]/gi, '') + key.length
    }),

    /**
     * @property json
     * A JSON representation of the managed keys and their associated selectors.
     * @returns {Object}
     * A key:selector object.
     */
    json: {
      enumerable: true,
      get: function () {
        var me = this
        var obj = {}

        Object.keys(this).forEach(function (el) {
          if (me.hasOwnProperty(el) && ['json', 'find', 'remove'].indexOf(el.trim().toLowerCase()) < 0 && typeof me[el] !== 'function') {
            obj[el] = me.keys[el]
          }
        })
        return obj
      }
    }
  })
}()
