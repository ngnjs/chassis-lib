/**
 * @class NGN.ref
 * A global "pointer" to DOM elements. This is used to reference and manipulate
 * DOM elements in a simple and standard way, without restricting native functionality.
 */
'use strict'

NGN.ref = new function () {
  var requireBUS = function (trigger, event, scope, nm, preventDefault) {
    if (NGN.BUS === undefined) {
      return console.error('The event BUS is required for ' + nm + '().')
    }
    preventDefault = NGN.coalesce(preventDefault, false)
    var fn = function (e) {
      if (preventDefault && e.preventDefault) {
        e.preventDefault()
      }
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
        var reference = NGN.ref.find((value + ' > ' + selector).trim())
        if (reference.length === 0) {
          var tmpref = NGN.ref.find((value).trim())[0].parentNode.querySelectorAll(selector)
          if (tmpref.length > 0) {
            if (tmpref.length === 1) {
              return tmpref[0]
            }
            return tmpref
          }
        }
        return reference
      }
      return NGN.ref.find(value.querySelectorAll(selector))
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
            isArray: NGN.get(function () {
              return false
            }, false)
          })
        }

        if (!els[0].hasOwnProperty('find')) {
          Object.defineProperty(els[0], 'find', NGN.const(function (selector) {
            return NGN.ref._find(value, selector)
          }))
        }

        if (!els[0].hasOwnProperty('forward')) {
          Object.defineProperty(els[0], 'forward', NGN.const(function (trigger, event) {
            requireBUS(trigger, event, this, 'forward')
          }))
        }

        if (!els[0].hasOwnProperty('on')) {
          Object.defineProperty(els[0], 'on', NGN.const(function () {
            this.addEventListener.apply(this, arguments)
          }))
        }

        result = els[0]
      } else {
        var base = NGN._slice(els)
        if (NGN.typeof(els) === 'nodelist' && base.length === 1) {
          base = base[0]
        }

        // Apply querySelector/All to the response for chaining.
        Object.defineProperties(base, {
          querySelector: NGN.define(false, false, false, function (selector) {
            qs(value, selector)
          }),

          querySelectorAll: NGN.define(false, false, false, function (selector) {
            qs(value, selector, true)
          }),

          addEventListener: NGN.define(false, false, false, function (evt, fn) {
            for (var el = 0; el < this.length; el++) {
              this[el].addEventListener(evt, fn)
            }
          }),

          removeEventListener: NGN.define(false, false, false, function (evt, fn) {
            for (var el = 0; el < this.length; el++) {
              this[el].removeEventListener(evt, fn)
            }
          }),

          find: NGN.const(function (selector) {
            return NGN.ref._find(value, selector)
          }),

          isArray: NGN.get(function () {
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
        Object.defineProperty(NGN.ref, cleankey, NGN.private(value))

        Object.defineProperty(NGN.ref, key, {
          enumerable: true,
          get: function () {
            return me.find(value)
          },
          set: function (val) {
            if (val === undefined || val === null || val.trim().length === 0) {
              throw new Error('Cannot create a null/undefined selector reference.')
            }
            NGN.ref[cleankey] = val
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
    remove: NGN.const(function (key) {
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
