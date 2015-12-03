/**
  * v1.0.10 generated on: Wed Dec 02 2015 21:08:07 GMT-0600 (CST)
  * Copyright (c) 2014-2015, Corey Butler. All Rights Reserved.
  */
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
  })
})

/**
 * @class DOM
 * A utility class to simplify smoe DOM management tasks.
 */
window.NGN.DOM = {}

Object.defineProperties(window.NGN.DOM, {
  /**
   * @method ready
   * Executes code after the DOM is loaded.
   * @param {function} callback
   * The function to call when the DOM is fully loaded.
   */
  ready: NGN.define(true, false, false, function (callback) {
    document.addEventListener('DOMContentLoaded', callback)
  }),

  /**
   * @method destroy
   * Remove a DOM element.
   * @param {HTMLElement|NodeList|String|Array} node
   * Accepts a single `HTMLElement`, a `NodeList`, a CSS selector, or
   * an array or `HTMLElements`/`NodeList`/CSS Selectors.
   */
  destroy: NGN.define(true, false, false, function (el) {
    var me = this
    // Process a CSS selector
    if (typeof el === 'string') {
      var str = el
      el = document.querySelectorAll(el)
      if (el.length === 0) {
        console.warn('The \"' + str + '\" selector did not return any elements.')
        return
      }
      // Iterate through results and remove each element.
      NGN._slice(el).forEach(function (node) {
        me.destroy(node)
      })
    } else {
      var type = NGN._typeof(el)
      switch (type) {
        case 'array':
          el.forEach(function (node) {
            me.destroy(node)
          })
          return
        case 'nodelist':
          NGN._slice(el).forEach(function (node) {
            me.destroy(node)
          })
          return
        case 'htmlelement':
          el.parentNode.removeChild(el)
          return
        default:
          if (/^html.*element$/.test(type)) {
            el.parentNode.removeChild(el)
            return
          }
          console.warn('An unknown error occurred while trying to remove DOM elements.')
          console.log('Unknown Element', el)
      }
    }
  }),

  /**
   * @method findParent
   * Find a distant parent of a DOM element. This can be thought
   * of as a reverse CSS selector that traverse UP the DOM chain
   * to find the parent element.
   *
   * For example:
   *
   * Assume the following HTML structure & JS code:
   *
   * ```html
   * <section>
   *   <header class="MyGroup">
   *     <div>
   *       <div>
   *         <button>Delete Entire Group</button>
   *       </div>
   *     </div>
   *   </header>
   * </section>
   * ```
   *
   * ```js
   * ref.find('button.remove').addEventListener('click', function (event) {
   *   event.preventDefault()
   *   var removeButton = event.currentTarget
   *   var group = ref.findParent(removeButton,'header')
   *   ref.destroy(group)
   * })
   * ```
   *
   * The code above listens for a click on the button. When the button
   * is clicked, the `findPerent` method recognizes the "Delete Entire Group"
   * button and traverses UP the DOM chain until it finds a `header` DOM
   * element. The `header` DOM element is returned (as `group` variable). The
   * group is then removed using the `ref.destroy` method.
   *
   * Alternatively, the same effect could have been achieved if line 4
   * of the JS code was:
   * ```js
   * var group = ref.findParent(removeButton, '.MyGroup')
   * ```
   * @param {HTMLElement|String} element
   * The DOM element or a CSS selector string identifying the
   * element whose parent should be found.
   * @param {String} selector
   * A minimal CSS selector used to identify the parent.
   * @param {Number} maxDepth
   * The maximum number of elements to traverse. This can be used to
   * cap a selector and force it to fail before reaching a known limit.
   * By default, there is no limit (i.e. maxDepth=null).
   * @returns {HTMLElement}
   * Responds with the DOM Element, or `null` if none was found.
   */
  findParent: NGN.define(true, false, false, function (node, selector, maxDepth) {
    if (typeof node === 'string') {
      node = document.querySelectorAll(node)
      if (node.length === 0) {
        console.warn('\"' + node + '\" is an invalid CSS selector (Does not identify any DOM elements).')
        return null
      }
      node = node[0]
    }

    var currentNode = node.parentNode
    var i = 0
    maxDepth = typeof maxDepth === 'number' ? maxDepth : -1

    while (currentNode.parentNode.querySelector(selector) === null && currentNode.nodeName !== 'BODY') {
      i++
      if (maxDepth > 0 && i > maxDepth) {
        return null
      }
      currentNode = currentNode.parentNode
    }

    return currentNode
  }),

  /**
   * @method indexOfParent
   * Returns the zero-based index of the DOM element related
   * to it's parent element.
   * For example:
   *
   * `html
   * <div>
   *   <p>...</p>
   *   <p>...</p>
   *   <button id="btn"></button>
   *   <p>...</p>
   * </div>
   * ```
   *
   * ```js
   * var i = NGN.DOM.indexOfParent(document.getElementById('btn'))
   * console.log(i) // 2
   * ```
   * @param {HTMLElement} el
   * The reference element.
   * @returns {number}
   */
  indexOfParent: NGN.define(true, false, false, function (el) {
    return NGN._slice(el.parentNode.children).indexOf(el)
  })
})

/**
 * @class BUS
 * The bus acts as a pub/sub messaging system (as opposed to a queue). It is primarily
 * designed for asynchronous communication between javascript objects, but can also be
 * bound to DOM events.
 *
 * The most common use looks like:
 * ```js
 *   var subscriber = NGN.BUS.subscribe('test', function () {
 *     console.log('test handled')
 *   })
 *
 *   NGN.BUS.subscribeOnce('test', function () {
 *     console.log('RESPOND ONCE!')
 *   })
 *
 *   NGN.BUS.publish('test') // Outputs "test handled" and "RESPOND ONCE".
 *
 *   NGN.BUS.publish('test') // Outputs "test handled" only.
 *
 *   subscriber.unsubscribe() // Removes the listener
 *
 *   NGN.BUS.publish('test') // Outputs nothing since the subscription was removed.
 * ```
 * There are a few aliases for ease of use, including `on() --> subscribe()`,
 * `once() --> subscribeOnce()`, and `emit() --> publish()`.
 *
 * It is also possible to use a wildcard in a subscription.
 *
 * ```js
 *   var subscriber = NGN.BUS.subscribe('test.*', function () {
 *     console.log('test handled')
 *   })
 *   var subscriber = NGN.BUS.subscribe('test.create', function () {
 *     console.log('test create handled')
 *   })
 *
 *   NGN.BUS.publish('test.create') // Outputs "test handled" and "test create handled"
 *
 *   NGN.BUS.publish('test.delete') // Outputs "test handled"
 * ```
 * @singleton
 */
window.NGN.BUS = (function () {
  var topics = []
  var oneoff = []
  var bubble = []
  var obj = {}

  var _getTopic = function (arr, topic) {
    var t = arr.filter(function (t) {
      return topic.toLowerCase() === t[0].toLowerCase()
    })
    if (t.length === 0) {
      return null
    }
    if (t.length > 1) {
      console.warn('NGN Event Bus: ' + t[0][0] + ' exists more than once.')
    }
    return t[0].filter(function (el, i) {
      return i !== 0
    })
  }

  var getTopic = function (topic) {
    return _getTopic.apply(this, [topics, topic])
  }

  var getOneOffTopic = function (topic) {
    return _getTopic.apply(this, [oneoff, topic])
  }

  var getBubble = function (topic) {
    return _getTopic.apply(this, [bubble, topic])
  }

  var validInput = function (topic, listener) {
    return topic === null || topic === undefined || listener === null || listener === undefined
  }

  Object.defineProperties(obj, {
    /**
     * @method subscribe
     * Subscribe to an event.
     * @param {string} event
     * The event name.
     * @param {Function} listener
     * The callback for handling an event.
     * @param {any} [listener.data=null]
     * A data payload supplied by the event.
     */
    subscribe: NGN.define(true, false, false, function (topic, listener) {
      // Validate input
      if (validInput(topic, listener)) {
        throw new Error('subscribe() requires a topic and listener function as arguments.')
      }

      // Create the topic if not yet created
      var t = getTopic(topic)
      t !== null && t.unshift(topic)
      t === null && (t = [topic]) && topics.push(t)
      // Add the listener to queue
      var index = t.push(listener)

      // Update the topic with the new queue
      topics[topics.map(function (row) { return row[0] }).indexOf(topic)] = t

      // Provide handle back for removal of topic
      return {
        unsubscribe: function () {
          t = t.splice(index, 1)
          if (t.length === 0) {
            topics.splice(topics.map(function (row) { return row[0] }).indexOf(topic), 1)
          } else {
            topics[topics.map(function (row) { return row[0] }).indexOf(topic)] = t
          }
        }
      }
    }),

    /**
     * @method subscribeOnce
     * Subscribe to an event. The handler/listener will only be executed the first time
     * the event is detected, then it is removed after it is executed.
     * @type {Object}
     */
    subscribeOnce: NGN.define(true, false, false, function (topic, listener) {
      // Validate input
      if (validInput(topic, listener)) {
        throw new Error('subscribeOnce() requires a topic and listener function as arguments.')
      }

      // Create the topic if not yet created
      var t = getOneOffTopic(topic)
      t !== null && t.unshift(topic)
      t === null && (t = [topic]) && oneoff.push(t)

      // Add the listener
      t.push(listener)

      // Update the topic with the new queue
      oneoff[oneoff.map(function (row) { return row[0] }).indexOf(topic)] = t
    }),

    /**
     * @method on
     * Alias for #subscribe.
     */
    on: NGN.define(true, false, false, function () {
      return this.subscribe.apply(this, arguments)
    }),

    /**
     * @method once
     * Alias for #subscribeOnce.
     */
    once: NGN.define(true, false, false, function () {
      return this.subscribeOnce.apply(this, arguments)
    }),

    /**
     * @method bind
     * A special subscriber that fires one or more event in response to
     * to an event. This is used to bubble events up/down an event chain.
     *
     * For example:
     *
     * ```js
     * BUS.bind('sourceEvent', ['someEvent','anotherEvent'], {payload:true})
     * ```
     * When `sourceEvent` is published, the bind method triggers `someEvent` and
     * `anotherEvent`, passing the payload object to `someEvent` and
     * `anotherEvent` subscribers simultaneously.
     *
     * @param {String} sourceEvent
     * The event to subscribe to.
     * @param {String|Array} triggeredEvent
     * An event or array of events to fire in response to the sourceEvent.
     * @returns {Object}
     * Returns an object with a single `remove()` method.
     */
    bind: NGN.define(true, false, true, function (topic, trigger, meta) {
      trigger = typeof trigger === 'string' ? [trigger] : trigger

      // Create the topic if not yet created
      var t = getBubble(topic)
      t !== null && t.unshift(topic)
      t === null && (t = [topic]) && bubble.push(t)

      var me = this
      var listener = function (info) {
        trigger.forEach(function (tEvent) {
          me.publish(tEvent, info !== undefined ? info : {})
        })
      }

      // Add the listener to queue
      var index = t.push(listener)

      // Update the topic with the new queue
      bubble[bubble.map(function (row) { return row[0] }).indexOf(topic)] = t

      // Provide handle back for removal of topic
      return {
        remove: function () {
          t = t.splice(index, 1)
          if (t.length === 0) {
            bubble.splice(bubble.map(function (row) { return row[0] }).indexOf(topic), 1)
          } else {
            bubble[bubble.map(function (row) { return row[0] }).indexOf(topic)] = t
          }
        }
      }
    }),

    // Execute any listeners using a wildcard event match.
    execWildcardListeners: NGN.define(false, false, false, function (topic, info, _t, map) {
      var scope = {
        eventName: topic
      }
      map = map === undefined ? true : map
      _t = _t.filter(function (t) {
        if (t[0].indexOf('*') >= 0) {
          var re = new RegExp(t[0].replace('*', '.*', 'gi'))
          return re.test(topic)
        }
        return false
      })
      if (map) {
        _t = _t.map(function (arr) {
          return arr.slice(1, arr.length)
        })
      }
      _t.forEach(function (t) {
        t.forEach(function (fn) {
          fn.call(scope, info !== undefined ? info : {})
        })
      })
    }),

    execListeners: NGN.define(false, false, false, function (topic, info, _t) {
      var scope = {
        eventName: topic
      }
      if (_t !== null) {
        _t.forEach(function (item) {
          item.call(scope, info !== undefined ? info : {})
        })
      }
    }),

    /**
     * @method publish
     * Publish/trigger/fire an event.
     * @param {String} event
     * The event to fire.
     * @param {any} data
     * The payload to send to any event listeners/handlers.
     */
    publish: NGN.define(true, false, false, function (topic, info) {
      var t = getTopic(topic)
      var ot = getOneOffTopic(topic)
      var b = getBubble(topic)

      // Cycle through topics and execute standard listeners
      this.execListeners(topic, info, t)

      // Cycle through one-off topics and execute listeners
      if (ot !== null) {
        oneoff = oneoff.filter(function (_t) {
          return _t[0].toLowerCase() !== topic.toLowerCase()
        })
        this.execListeners(topic, info, ot)
      }

      // Cycle through bubble listeners
      this.execListeners(topic, info, b)
      this.execWildcardListeners(topic, info, topics)

      // Execute any one-off listeners using a wildcard event match.
      this.execWildcardListeners(topic, info, oneoff)
      oneoff = oneoff.filter(function (t) {
        if (t[0].indexOf('*') >= 0) {
          var re = new RegExp(t[0].replace('*', '.*', 'gi'))
          return !re.test(topic)
        }
        return true
      })

      // Trigger any bubbled events using a wildcard
      this.execWildcardListeners(topic, info, oneoff, false)
    }),

    /**
     * @method clear
     * Remove all handlers for an event.
     * @param {String} event
     * The event to trigger.
     */
    clear: NGN.define(false, false, false, function (topic) {
      var filter = function (a) {
        return a.filter(function (t) {
          return t[0].toLowerCase() !== topic.toLowerCase()
        })
      }
      topics = filter(topics)
      oneoff = filter(oneoff)
      bubble = filter(bubble)
    }),

    /**
     * @method emit
     * An alias for #publish.
     */
    emit: NGN.define(true, false, false, function () {
      return this.publish.apply(this, arguments)
    }),

    /**
     * @property {Object} subscribers
     * An array of all subscribers which currently have a registered event handler.
     */
    subscribers: NGN._get(function () {
      var sum = {}
      topics.forEach(function (t) {
        sum[t[0]] = {
          persist: t.length - 1,
          adhoc: 0
        }
      })
      oneoff.forEach(function (t) {
        sum[t[0]] = sum[t[0]] || {
          persist: 0
        }
        sum[t[0]].adhoc = t.length - 1
      })

      return sum
    }),

    /**
     * @property {Array} persistentSubscribers
     * All subscribers with a persistent (i.e. normal) registered event handler.
     */
    persistentSubscribers: NGN._get(function () {
      return topics.map(function (t) {
        return t[0]
      }).sort()
    }),

    /**
     * @property {Array} adhocSubscribers
     * All subscribers with a one-time registered event handler. The handlers of events
     * are removed after the first time the event is heard by the BUS.
     */
    adhocSubscribers: NGN._get(function () {
      return oneoff.map(function (t) {
        return t[0]
      }).sort()
    }),

    /**
     * @property {Array} autoSubscribers
     * All subscribers established using the #bind method.
     */
    autoSubscribers: NGN._get(function () {
      return bubble.map(function (t) {
        return t[0]
      }).sort()
    }),

    /**
     * @method pool
     * A helper command to create multiple related subscribers
     * all at once. This is a convenience function.
     * @property {string} [prefix]
     * Supply a prefix to be added to every event. For example,
     * `myScope.` would turn `someEvent` into `myScope.someEvent`.
     * @property {Object} subscriberObject
     * A key:value object where the key is the name of the
     * unprefixed event and the key is the handler function.
     * @property {Function} [callback]
     * A callback to run after the entire pool is registered. Receives
     * a single {Object} argument containing all of the subscribers for
     * each event registered within the pool.
     */
    pool: NGN.define(true, false, false, function (prefix, obj, callback) {
      if (typeof prefix !== 'string') {
        obj = prefix
        prefix = ''
      }

      var me = this
      var pool = {}

      Object.keys(obj).forEach(function (e) {
        if (typeof obj[e] === 'function') {
          pool[e] = me.subscribe((prefix.trim() || '') + e, obj[e])
        } else {
          console.warn((prefix.trim() || '') + e + ' could not be pooled in the event bus because it\'s value is not a function.')
        }
      })

      callback && callback(pool)
    }),

    /**
     * @method attach
     * Attach a function to a topic. This can be used
     * to forward events in response to asynchronous functions.
     *
     * For example:
     *
     * ```js
     * myAsyncDataFetch(BUS.attach('topicName'))
     * ```
     *
     * This is the same as:
     *
     * ```js
     * myAsyncCall(function (data) {
     *   NGN.BUS.emit('topicName', data)
     * })
     * ```
     * @returns {function}
     */
    attach: NGN.define(true, false, false, function (topic) {
      var me = this
      return function () {
        var args = NGN._slice(arguments)
        args.unshift(topic)
        me.publish.apply(me, args)
      }
    })

  })
  return obj
})()

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
        if (NGN._typeof(els) === 'nodelist' && base.length === 1) {
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

/**
 * @class HTTP
 * A library to issue HTTP/S requests. This acts as an AJAX library.
 * @author Corey Butler
 * @singleton
 */
var parser = new DOMParser()

window.NGN.HTTP = {}

Object.defineProperties(window.NGN.HTTP, {
  /**
   * @method xhr
   * Issue an XHR request.
   * @private
   * @param  {Function} callback
   * The callback to execute when the request finishes (or times out.)
   */
  xhr: NGN.define(false, false, false, function (callback) {
    var res

    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      res = new XMLHttpRequest()
    }

    res.onreadystatechange = function () {
      if (res.readyState === 4) {
        callback && callback(res)
      }
    }

    return res
  }),

  /**
   * @method run
   * A wrapper to execute a request.
   * @private
   * @param  {string} method required
   * The method to issue, such as GET, POST, PUT, DELETE, OPTIONS, etc.
   * @param  {string} url
   * The URL where the request is issued to.
   * @param  {Function} callback
   * A function to call upon completion.
   */
  run: NGN.define(false, false, false, function (method, url, callback) {
    var res = NGN.HTTP.xhr(callback)
    res.open(method, url, true)
    res.send()
  }),

  /**
   * @method applyRequestSettings
   * Apply any configuration details to issue with the request,
   * such as `username`, `password`, `headers`, etc.
   * @private
   * @param {object} xhr
   * The XHR request object.
   * @param {object} cfg
   * The key/value configuration object to apply to the request.
   * @param {object} cfg.params
   * A key/value object containing URL paramaters to be passed with the request.
   * These will automatically be URI-encoded.
   * @param {object} cfg.headers
   * A key/value object containing additional headers and associated values to
   * be passed with the request.
   * @param {object} cfg.body
   * An arbitrary body to pass with the request. If no `Content-Type` header is
   * provided, a `Content-Type: application/textcharset=UTF-8` header is automatically supplied.
   * This cannot be used with @cfg.json.
   * @param {object} cfg.json
   * A JSON object to be sent with the request. It will automatically be
   * parsed for submission. By default, a `Content-Type: application/json`
   * header will be applied (this can be overwritten useing @cfg.headers).
   * @param {object} cfg.form
   * This accepts a key/value object of form elements, or a reference to a <FORM>
   * HTML element. This automatically adds the appropriate headers.
   * @param {string} username
   * A basicauth username to add to the request. This is sent in plain
   * text, so using SSL to encrypt/protect it is recommended.
   * @param {string} password
   * A basicauth password to add to the request. This is sent in plain
   * text, so using SSL to encrypt/protect it is recommended.
   * @param {boolean} [withCredentials=false]
   * indicates whether or not cross-site `Access-Control` requests should be
   * made using credentials such as cookies or authorization headers.
   * The default is `false`.
   */
  applyRequestSettings: NGN.define(false, false, false, function (xhr, cfg) {
    if (!xhr || !cfg) {
      throw new Error('No XHR or configuration object defined.')
    }

    // Add URL Parameters
    if (cfg.params) {
      var parms = Object.keys(cfg.params).map(function (parm) {
        return parm + '=' + encodeURIComponent(cfg.params[parm])
      })
      cfg.url += '?' + parms.join('&')
    }

    xhr.open(cfg.method || 'POST', cfg.url, true)

    // Set headers
    cfg.header = cfg.header || cfg.headers || {}
    Object.keys(cfg.header).forEach(function (header) {
      xhr.setRequestHeader(header, cfg.header[header])
    })

    // Handle body (Blank, plain text, or JSON)
    var body = null
    if (cfg.json) {
      if (!cfg.header || (cfg.header && !cfg.header['Content-Type'])) {
        xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      }
      body = JSON.stringify(cfg.json).trim()
    } else if (cfg.body) {
      if (!cfg.header || (cfg.header && !cfg.header['Content-Type'])) {
        xhr.setRequestHeader('Content-Type', 'application/text')
      }
      body = cfg.body
    } else if (cfg.form) {
      body = new FormData()
      Object.keys(cfg.form).forEach(function (el) {
        body.append(el, cfg.form[el])
      })
    }

    // Handle withCredentials
    if (cfg.withCredentials) {
      xhr.withCredentials = cfg.withCredentials
    }

    // Handle credentials sent with request
    // if (cfg.username) {
    //   xhr.user = cfg.username
    // }
    // if (cfg.password) {
    //   xhr.password = cfg.password
    // }
    if (cfg.username && cfg.password) {
      // Basic Auth
      xhr.setRequestHeader('Authorization', 'Basic ' + btoa(cfg.username + ':' + cfg.password))
    } else if (cfg.accessToken) {
      // Bearer Auth
      xhr.setRequestHeader('Authorization', 'Bearer ' + cfg.accessToken)
    }

    return body
  }),

  /**
   * @method send
   * Send the request via HTTP/S.
   * @param  {object} cfg
   * The configuration to use when sending the request. See @applyRequestSettings#cfg
   * for configuration details.
   * @param  {Function} callback
   * A callback to excute upon completion. This receives a standard response
   * object.
   */
  send: NGN.define(true, false, false, function (cfg, callback) {
    cfg = cfg || {}
    var res = this.xhr(callback)
    var body = this.applyRequestSettings(res, cfg)
    res.send(body)
  }),

  /**
   * @method prepend
   * A helper method to prepend arguments.
   * @private
   * @param  {[type]} args [description]
   * @param  {[type]} el   [description]
   * @return {[type]}      [description]
   */
  prepend: NGN.define(false, false, false, function (args, el) {
    args = NGN._slice(args)
    args.unshift(el)
    return args
  }),

  /**
   * @method get
   * Issue a `GET` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  get: NGN.define(true, false, false, function () {
    if (typeof arguments[0] === 'object') {
      var cfg = arguments[0]
      cfg.method = 'GET'
      cfg.url = typeof arguments[1] === 'string' ? arguments[1] : cfg.url
      return this.send(cfg, arguments[arguments.length - 1])
    }
    this.run.apply(this.run, this.prepend(arguments, 'GET'))
  }),

  /**
   * @method put
   * Issue a `PUT` request.
   * @param  {object} cfg
   * See the options for @send#cfg
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  put: NGN.define(true, false, false, function (cfg, callback) {
    cfg = cfg || {}
    cfg.method = 'PUT'
    cfg.url = cfg.url || window.location
    this.send(cfg, callback)
  }),

  /**
   * @method post
   * Issue a `POST` request.
   * @param  {object} cfg
   * See the options for @send#cfg
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  post: NGN.define(true, false, false, function (cfg, callback) {
    cfg = cfg || {}
    cfg.method = 'POST'
    cfg.url = cfg.url || window.location
    this.send(cfg, callback)
  }),

  /**
   * @method delete
   * Issue a `DELETE` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  delete: NGN.define(true, false, false, function () {
    this.run.apply(this.run, this.prepent(arguments, 'DELETE'))
  }),

  /**
   * @method json
   * This is a shortcut method for creating a `GET` request and
   * auto-processing the response body into a JSON object.
   * @param  {string} url
   * The URL to issue the request to.
   * @param  {Function} callback
   * This receives a JSON response object from the server as it's only argument.
   */
  json: NGN.define(true, false, false, function (cfg, url, callback) {
    if (typeof cfg === 'string') {
      callback = url
      url = cfg
      cfg = null
    }
    if (cfg === null) {
      this.run('GET', url, function (res) {
        if (res.status !== 200) {
          throw Error('Could not retrieve JSON data from ' + url + ' (Status Code: ' + res.status + ').')
        }
        try {
          res.json = JSON.parse(res.responseText)
        } catch (e) {
          res.json = null
        }
        callback && callback(res.json)
      })
    } else {
      cfg.url = url
      this.get(cfg, function (res) {
        if (res.status !== 200) {
          throw Error('Could not retrieve JSON data from ' + url + ' (Status Code: ' + res.status + ').')
        }
        try {
          res.json = JSON.parse(res.responseText)
        } catch (e) {
          res.json = null
        }
        callback && callback(res.json)
      })
    }
  }),

  /**
   * @method normalizeUrl
   * Cleanup a URL.
   * @private
   */
  normalizeUrl: NGN.define(false, false, false, function (url) {
    var uri = []

    url.split('/').forEach(function (el) {
      if (el === '..') {
        uri.pop()
      } else if (el !== '.') {
        uri.push(el)
      }
    })

    return uri.join('/')
  }),

  /**
   * @method import
   * Import a remote HTML fragment.
   * @param {string} url
   * The URL of remote HTML snippet. If the URL has a `.js` or `.css`
   * extension, it will automatically be added to the `<head>`.
   * @param {string} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement|NodeList} callback.element
   * The new DOM element.
   * @param {boolean} [bypassCache=false]
   * When set to `true`, bypass the cache.
   * @fires html.import
   * Returns the HTMLElement/NodeList as an argument to the event handler.
   */
  import: NGN.define(true, false, false, function (url, callback, bypassCache) {
    // Support JS/CSS
    var ext = null
    try {
      ext = url.split('/').pop().split('?')[0].split('.').pop().toLowerCase()
      var s
      if (ext === 'js') {
        s = document.createElement('script')
        s.setAttribute('type', 'text/javascript')
        s.setAttribute('src', url)
      } else if (ext === 'css') {
        s = document.createElement('link')
        s.setAttribute('rel', 'stylesheet')
        s.setAttribute('type', 'text/css')
        s.setAttribute('href', url)
      }
      s.onload = callback || function () {}
      document.getElementsByTagName('head')[0].appendChild(s)
    } catch (e) {}

    if (['js', 'css'].indexOf((ext || '').trim().toLowerCase()) >= 0) {
      return
    }

    bypassCache = typeof bypassCache === 'boolean' ? bypassCache : false

    // If a local reference is provided, complete the path.
    if (url.substr(0, 4) !== 'http') {
      var path = window.location.href.split('/')
      path.pop()
      url = path.join('/') + '/' + url
    }

    // Use the cache if defined & not bypassed
    if (!bypassCache && this.importCache.hasOwnProperty(url)) {
      var doc = this.createElement(this.importCache[url])
      callback && callback(doc.length === 1 ? doc[0] : doc)
      if (window.NGN.BUS) {
        window.NGN.BUS.emit('html.import', doc.length === 1 ? doc[0] : doc)
      }
      // console.warn('Used cached version of '+url)
      return
    }

    // Retrieve the file content
    var me = this
    this.get(url, function (res) {
      if (res.status !== 200) {
        return console.warn('Check the file path of the snippet that needs to be imported. ' + url + ' could not be found (' + res.status + ')')
      }

      var doc = me.createElement(res.responseText)
      me.importCache[url] = res.responseText

      if (doc.length === 0) {
        console.warn(me.normalizeUrl(url) + ' import has no HTML tags.')
        callback && callback(res.responseText)
        if (window.NGN.BUS) {
          window.NGN.BUS.emit('html.import', res.responseText)
        }
      } else {
        var el = doc.length === 1 ? doc[0] : doc
        callback && callback(el)
        if (window.NGN.BUS) {
          window.NGN.BUS.emit('html.import', el)
        }
      }
    })
  }),

  /**
   * @method processImport
   * A helper class to process imported content and place
   * it in the DOM accordingly.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   * @param {boolean} [before=false]
   * If set to true, insert before the callback.element.
   * @private
   */
  processImport: NGN.define(false, false, false, function (url, target, callback, before) {
    before = before !== undefined ? before : false
    this.import(url, function (element) {
      if (typeof element === 'string') {
        element = document.createTextNode(element)
      } else if (element.length) {
        var out = []
        NGN._slice(element).forEach(function (el) {
          if (before) {
            out.push(target.parentNode.insertBefore(el, target))
            target = el
          } else {
            out.push(target.appendChild(el))
          }
        })
        callback && callback(out)
        return
      }
      if (before) {
        target.parentNode.insertBefore(element, target)
      } else {
        target.appendChild(element)
      }
      callback && callback(element)
    })
  }),

  /**
   * @method importTo
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the specified DOM element. This is
   * the equivalent of using results of the #import to retrieve a
   * snippet, then doing a `target.appendChild(importedElement)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importTo: NGN.define(true, false, false, function (url, target, callback) {
    this.processImport(url, target, callback)
  }),

  /**
   * @method importBefore
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the DOM before the target element. This is
   * the equivalent of using results of the #import to retrieve a snippet,
   * then doing a `target.parentNode.insertBefore(importedElement, target)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement/NodeList, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importBefore: NGN.define(true, false, false, function (url, target, callback) {
    this.processImport(url, target, callback, true)
  }),

  /**
   * @method domainRoot
   * Returns the root (no http/s) of the URL.
   * @param {string} url
   * The URL to get the root of.
   * @private
   */
  domainRoot: NGN.define(false, false, false, function (url) {
    var r = (url.search(/^https?\:\/\//) !== -1 ? url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, '') : url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, ""))
    return r === null || r[1].length < 3 ? window.location.host : r[1]
  }),

  /**
   * @method isCrossOrigin
   * Determine if accessing a URL is considered a cross origin request.
   * @param {string} url
   * The URL to identify as a COR.
   * @returns {boolean}
   * @private
   */
  isCrossOrigin: NGN.define(false, false, false, function (url) {
    return this.domainRoot(url) !== window.location.host
  }),

  /**
   * @method prelink
   * A helper method to construct pre-fetch style DOM elements.
   * This also fires an event when the element is added to the DOM.
   * @param {string} url
   * The URL of the operation.
   * @param {string} rel
   * The type of operation. For example: `preconnect`.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @private
   */
  prelink: NGN.define(false, false, false, function (url, rel, cor) {
    var p = document.createElement('link')
    p.rel = rel
    p.href = url.indexOf('http') !== 0 ? this.normalizeUrl(this.domainRoot(url) + url) : url
    NGN.coalesce(cor, this.isCrossOrigin(url)) && (p.setAttribute('crossorigin', 'true'))
    document.head.appendChild(p)
    NGN.emit('network.' + rel)
  }),

  /**
   * @method predns
   * This notifies the browser domains which will be accessed at a later
   * time. This helps the browser resolve DNS inquiries quickly.
   * @param {string} domain
   * The domain to resolve.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network-dns-prefetch
   * Fired when a pre-fetched DNS request is issued to the browser.
   */
  predns: NGN.define(true, false, false, function (domain, cor) {
    this.prelink(window.location.protocol + '//' + domain, 'dns-prefetch', cor)
  }),

  /**
   * @method preconnect
   * Tell the browser which remote resources will or may be used in the
   * future by issuing a `Preconnect`. This will resolve DNS (#predns), make the TCP
   * handshake, and negotiate TLS (if necessary). This can be done directly
   * in HTML without JS, but this method allows you to easily preconnect
   * a resource in response to a user interaction or NGN.BUS activity.
   * @param {string} url
   * The URL to preconnect to.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.preconnect
   * Fired when a preconnect is issued to the browser.
   */
  preconnect: NGN.define(true, false, false, function (url, cor) {
    this.prelink(url, 'preconnect', cor)
  }),

  /**
   * @method prefetch
   * Fetch a specific resource and cache it.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  prefetch: NGN.define(true, false, false, function (url, cor) {
    this.prelink(url, 'prefetch', cor)
  }),

  /**
   * @method subresource
   * A prioritized version of #prefetch. This should be used
   * if the asset is required for the current page. Think of this
   * as "needed ASAP". Otherwise, use #prefetch.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  subresource: NGN.define(true, false, false, function (url, cor) {
    this.prelink(url, 'subresource', cor)
  }),

  /**
   * @method prerender
   * Prerender an entire page. This behaves as though a page is
   * opened in a hidden tab, then displayed when called. This is
   * powerful, but should only be used when there is absolutely
   * certainty that the prerendered page will be needed. Otherwise
   * all of the assets are loaded for no reason (i.e. uselessly
   * consuming bandwidth).
   * @param {string} url
   * URL of the page to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prerender
   * Fired when a prerender is issued to the browser.
   */
  prerender: NGN.define(true, false, false, function (url, cor) {
    this.prelink(url, 'prerender', cor)
  }),

  /**
   * @method template
   * Include a simple variable replacement template and apply
   * values to it. This is always cached client side.
   * @param {string} url
   * URL of the template to retrieve.
   * @param {object} [variables]
   * A key/value objct containing variables to replace in
   * the template.
   * @param {function} callback
   * The callback receives a single argument with the HTMLElement/
   * NodeList generated by the template.
   */
  template: NGN.define(true, false, false, function (url, data, callback) {
    url = this.normalizeUrl(url)

    if (typeof data === 'function') {
      callback = data
      data = {}
    }

    data = data || {}

    var me = this
    var tpl

    // Check the cache
    if (this.importCache.hasOwnProperty(url)) {
      tpl = this.importCache[url]
      return this.applyData(tpl, data, callback)
    }

    this.get(url, function (res) {
      var ext = null
      try {
        ext = url.split('/').pop().split('?')[0].split('.').pop().toLowerCase()
      } catch (e) {}
      if (['js', 'css'].indexOf((ext || '').trim().toLowerCase()) >= 0) {
        console.warn('Cannot use a .' + ext + ' file as a template. Only HTML templates are supported.')
        return
      }

      me.importCache[url] = res.responseText
      me.applyData(res.responseText, data, callback)
    })
  }),

  importCache: NGN.define(false, true, false, {}),

  createElement: NGN.define(false, false, false, function (str) {
    return parser.parseFromString(str, 'text/html').querySelector('body').children
  }),

  applyData: NGN.define(false, false, false, function (tpl, data, callback) {
    if (tpl === undefined) {
      console.warn('Empty template.')
      callback && callback()
      return
    }

    // Apply data to the template.
    Object.keys(data).forEach(function (key) {
      var re = new RegExp('\{\{' + key + '\}\}', 'gm')
      tpl = tpl.replace(re, data[key])
    })

    // Clear any unused template code
    tpl = tpl.replace(/(\{\{.*\}\})/gm, '')

    var el = this.createElement(tpl)
    callback && callback(el[0])
  })
})

/**
 * @class NGN.DOM.svg
 * Provides a way to easily manage SVG images within a document while
 * retaining the ability to style them with external CSS.
 * @singleton
 */
 /* This file should be loaded in the <head>, not at the end of the <body>.
 * By loading this script before the rest of the DOM, it will insert the
 * FOUC (Flash of Unstyled Content) CSS into the page BEFORE unstyled SVG images
 * are loaded. If this script is included in the <body>, the CSS will be loaded
 * AFTER the SVG images are loaded, meaning they may display briefly before
 * proper styling can be applied to the DOM.
 */

// Prevent FOUC
var __preventfouc = function () {
  var ss = document.createElement('style')
  var str = document.createTextNode('img[src$=".svg"]{display:none}svg.loading{height:0px !important;width:0px !important}')
  ss.appendChild(str)
  document.head.appendChild(ss)
}
__preventfouc()

// SVG Controller
window.NGN = window.NGN || {}
window.NGN.DOM = window.NGN.DOM || {}
window.NGN.DOM.svg = {}

Object.defineProperties(window.NGN.DOM.svg, {
  /**
   * @property {Object} cache
   * A cache of SVG images.
   */
  cache: NGN.define(false, false, true, {}),

  /**
   * @method swap
   * Replace image tags with the SVG equivalent.
   * @param {HTMLElement|NodeList} imgs
   * The HTML element or node list containing the images that should be swapped out for SVG files.
   * @param {function} [callback]
   * Executed when the image swap is complete. There are no arguments passed to the callback.
   * @private
   */
  swap: NGN.define(false, false, false, function (imgs, callback) {
    for (var x = 0; x < imgs.length; x++) {
      var img = imgs[x]
      if (NGN.DOM.svg.cache[img.src] !== null && img !== null && img.parentNode !== null) {
        var svg = NGN.DOM.svg.cache[img.src].cloneNode(true)
        var attr = img.attributes
        for (var y = 0; y < attr.length; y++) {
          if (img.hasAttribute(attr[y].name) && attr[y].name.toLowerCase() !== 'src') {
            svg.setAttribute(attr[y].name, attr[y].value)
          }
        }
        if (svg.classList) {
          for (var i = 0; i < img.classList.length; i++) {
            svg.classList.add(img.classList[i])
          }
        } else {
          svg.setAttribute('class', img.getAttribute('class'))
        }
        img.parentNode.replaceChild(svg, img)
      }
    }
    callback && callback()
  }),

  /**
   * @method update
   * Replace any <img src="*.svg"> with the SVG equivalent.
   * @param {HTMLElement|NodeList} section
   * The HTML DOM element to update. All children of this element will also be updated.
   * @param {function} callback
   * Execute this function after the update is complete.
   */
  update: NGN.define(true, false, false, function (section, callback) {
    if (typeof section === 'function') {
      callback = section
      section = document.body
    } else {
      section = section || document.body
    }

    if (section.nodeName === '#text') {
      return
    }

    section = section.hasOwnProperty('length') === true
      ? NGN._splice(section)
      : [section]

    section.forEach(function (sec) {
      var imgs = sec.querySelectorAll('img[src$=".svg"]')

      // Loop through images, prime the cache.
      for (var i = 0; i < imgs.length; i++) {
        NGN.DOM.svg.cache[imgs[i].src] = NGN.DOM.svg.cache[imgs[i].src] || null
      }

      // Get all of the unrecognized svg files
      var processed = 0
      var cache = function (url, innerHTML) {
        var tag = document.createElement('div')
        tag.innerHTML = innerHTML
        NGN.DOM.svg.cache[url] = tag.querySelector('svg')
        NGN.DOM.svg.cache[url].removeAttribute('id')
        NGN.DOM.svg.cache[url].removeAttribute('xmlns:a')
      }

      Object.keys(NGN.DOM.svg.cache).forEach(function (url) {
        var _module = false
        try {
          _module = require !== undefined
        } catch (e) {}

        if (_module) {
          // Add support for node-ish environment (nwjs/electron)
          try {
            cache(url, require('fs').readFileSync(url.replace('file://', '')).toString())
          } catch (e) {
            console.log(e.stack)
          }
          processed++
        } else {
          // Original Browser-Based Vanilla JS
          NGN.HTTP.get(url, function (res) {
            res.status === 200 && cache(url, res.responseText)
            processed++
          })
        }
      })

      // Monitor for download completion
      var monitor = setInterval(function () {
        if (processed === Object.keys(NGN.DOM.svg.cache).length) {
          clearInterval(monitor)
          NGN.DOM.svg.swap(imgs, callback)
        }
      }, 5)
    })
  })
})

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

'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.Model
 * A data model.
 * @extends NGN.DATA.util.EventEmitter
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.delete
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
// NGN.DATA.Entity is the core class. NGN.DATA.Model extends
// this transparently.
window.NGN.DATA.Entity = function (config) {
  config = config || {}

  var me = this

  Object.defineProperties(this, {
    /**
     * @cfg {String} [idAttribute='id']
     * Setting this allows an attribute of the object to be used as the ID.
     * For example, if an email is the ID of a user, this would be set to
     * `email`.
     */
    idAttribute: NGN.define(false, false, false, config.idAttribute || 'id'),

    /**
     * @cfg {object} fields
     * A private object containing the data fields of the model, including
     * validators & default values.
     * ```js
     * fields: {
     *   fieldname: {
     *     required: true,
     *     type: String,
     *     default: 'default field value'
     *   },
     *   fieldname2: null // Uses default field config (default value is null)
     * }
     * ```
     */
    /**
     * @datafield {string} [id=null]
     * The unique ID of the person.
     */
    fields: NGN.define(false, true, true, config.fields ||
      {
        id: {
          required: true,
          type: String,
          'default': config.id || null
        }
      }
    ),

    /**
     * @property {Object}
     * A private object containing virtual data attributes and generated data.
     * @private
     */
    virtuals: NGN.define(false, true, true, config.virtuals || {}),

    /**
     * @property {Object}
     * The validation rules used to verify data integrity when persisting to a datasource.
     * @private
     */
    validators: NGN.define(false, true, false, {}),

    /**
     * @cfgproperty {boolean} [validation=true]
     * Toggle data validation using this.
     */
    validation: NGN.define(true, true, false, NGN.coalesce(config.validation, true)),

    /**
     * @property {Boolean}
     * Indicates the model is new or does not exist according to the persistence store.
     * @private
     * @readonly
     */
    isNew: NGN.define(false, true, false, true),

    /**
     * @property {Boolean}
     * Indicates the model has been destroyed/deleted and should no longer exist.
     * @private
     * @readonly
     */
    isDestroyed: NGN.define(false, true, false, false),

    /**
     * @property {Boolean}
     * Indicates one or more data properties has changed.
     * @readonly
     */
    modified: NGN._get(function () {
      return this.checksum !== this.benchmark
    }),

    /**
     * @property {String} [oid=null]
     * The raw object ID, which is either the #id or #idAttribute depending
     * on how the object is configured.
     * @private
     */
    oid: NGN.define(false, true, true, config[this.idAttribute] || null),

    /**
     * @cfgproperty {String/Number/Date} [id=null]
     * The unique ID of the model object. If #idAttribute is defined,
     * this will get/set the #idAttribute value.
     */
    id: {
      enumerable: true,
      get: function () {
        return this.oid
      },
      set: function (value) {
        this.oid = value
      }
    },

    /**
     * @property checksum
     * The unique checksum of the record (i.e. a record fingerprint).
     * This will change as the data changes.
     */
    checksum: NGN._get(function () {
      return NGN.DATA.util.checksum(JSON.stringify(this.data))
    }),

    benchmark: NGN.define(false, true, false, null),

    /**
     * @method setUnmodified
     * This method forces the model to be viewed as unmodified, as though
     * the record was just loaded from it's source. This method should only
     * be used when custom loading data. The #load method automatically
     * invokes this when record data is loaded. This also clears the history,
     * just as if the record is brand new.
     * @private
     */
    setUnmodified: NGN.define(false, false, false, function () {
      this.benchmark = this.checksum
      this.changelog = []
    }),

    /**
     * @cfg {Boolean} [allowInvalidSave=false]
     * Set this to true to allow a save even though not all of the data properties
     * pass validation tests.
     */
    allowInvalidSave: NGN.define(false, true, false, NGN.coalesce(config.allowInvalidSave, false)),

    /**
     * @cfg {Boolean} [disableDataValidation=false]
     * Only used when #save is called. Setting this to `true` will bypass data validation.
     */
    disableDataValidation: NGN.define(false, true, false, NGN.coalesce(config.disableDataValidation, false)),

    invalidDataAttributes: NGN.define(false, true, false, []),

    initialDataAttributes: NGN.define(false, true, false, []),

    /**
     * @property {array} changelog
     * An ordered array of changes made to the object data properties.
     * This cannot be changed manually. Instead, use #history
     * and #undo to manage this list.
     * @private
     */
    changelog: NGN.define(false, true, false, []),

    _nativeValidators: NGN.define(false, false, false, {
      min: function (min, value) {
        if (value instanceof Array) {
          return value.length >= min
        }
        if (value instanceof Number) {
          return value >= min
        }
        if (value instanceof String) {
          return value.trim().length >= min
        }
        if (value instanceof Date) {
          return value.parse() >= min.parse()
        }
        return false
      },
      max: function (max, value) {
        if (value instanceof Array) {
          return value.length <= max
        }
        if (value instanceof Number) {
          return value <= max
        }
        if (value instanceof String) {
          return value.trim().length <= max
        }
        if (value instanceof Date) {
          return value.parse() <= max.parse()
        }
        return false
      },
      'enum': function (valid, value) {
        return valid.indexOf(value) >= 0
      },
      required: function (field) {
        return this.hasOwnProperty(field)
      }
    }),

    /**
     * @cfgproperty {Object} dataMap
     * An object mapping model attribute names to data storage field names.
     *
     * _Example_
     * ```
     * {
     *   father: 'dad',
     *	 email: 'eml',
     *	 image: 'img',
     *	 displayName: 'dn',
     *	 firstName: 'gn',
     *	 lastName: 'sn',
     *	 middleName: 'mn',
     *	 gender: 'sex',
     *	 dob: 'bd',
     * }
     * ```
     */
    _dataMap: NGN.define(true, true, false, config.dataMap || null),
    _reverseDataMap: NGN.define(true, true, false, null),

    dataMap: {
      get: function () { return this._dataMap },
      set: function (value) {
        this._dataMap = value
        this._reverseDataMap = null
      }
    },

    /**
     * @property {object} reverseMap
     * Reverses the data map. For example, if the original #dataMap
     * looks like:
     *
     * ```js
     * {
     *    firstname: 'gn',
     *    lastname: 'sn
     * }
     * ```
     *
     * The reverse map will look like:
     *
     * ```js
     * {
     *    gn: 'firstname',
     *    sn: 'lastname
     * }
     * ```
     */
    reverseMap: NGN._get(function () {
      if (this.dataMap !== null) {
        if (this._reverseDataMap !== null) {
          return this._reverseDataMap
        }
        var rmap = {}
        Object.keys(this._dataMap).forEach(function (attr) {
          rmap[me._dataMap[attr]] = attr
        })
        this._reverseDataMap = rmap
        return rmap
      }
      return null
    }),

    /**
     * @property {object} raw
     * The raw data.
     * @private
     */
    raw: NGN.define(false, true, false, {}),

    /**
     * @method on
     * Create an event handerl
     */

    /**
      * @method addValidator
      * Add or update a validation rule for a specific model property.
      * @param {String} field
      * The data field to test.
      * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
      * The validation used to test the property value. This should return
      * `true` when the data is valid and `false` when it is not.
      *
      * * When this is a _function_, the value is passed to it as an argument.
      * * When this is a _String_, the value is compared for an exact match (case sensitive)
      * * When this is a _Number_, the value is compared for equality.
      * * When this is a _Date_, the value is compared for exact equality.
      * * When this is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
      * * When this is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
      * * When this is _an array of dates_, the value is compared to each date for equality.
      * @fires validator.add
      */
    addValidator: NGN.define(true, false, false, function (property, validator) {
      if (!this.hasOwnProperty(property)) {
        console.warn('No validator could be create for ' + property.toUpperCase() + '. It is not an attribute of ' + this.type.toUpperCase() + '.')
        return
      }
      switch (typeof validator) {
        case 'function':
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(validator)
          this.emit('validator.add', property)
          break
        case 'object':
          if (Array.isArray(validator)) {
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.indexOf(value) >= 0
            })
            this.emit('validator.add', property)
          } else if (validator.test) { // RegExp
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.test(value)
            })
            this.emit('validator.add', property)
          } else {
            console.warn('No validator could be created for ' + property.toUpperCase() + '. The validator appears to be invalid.')
          }
          break
        case 'string':
        case 'number':
        case 'date':
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(function (value) {
            return value === validator
          })
          this.emit('validator.add', property)
          break
        default:
          console.warn('No validator could be create for ' + property.toUpperCase() + '. The validator appears to be invalid.')
      }
    }),

    /**
      * @method removeValidator
      * Remove a data validator from the object.
      * @param {String} attribute
      * The name of the attribute to remove from the validators.
      * @fires validator.remove
      */
    removeValidator: NGN.define(true, false, false, function (attribute) {
      if (this.validators.hasOwnProperty(attribute)) {
        delete this.validators[attribute]
        this.emit('validator.remove', attribute)
      }
    }),

    /**
      * @method validate
      * Validate one or all attributes of the data.
      * @param {String} [attribute=null]
      * Validate a specific attribute. By default, all attributes are tested.
      * @private
      * @returns {Boolean}
      * Returns true or false based on the validity of data.
      */
    validate: NGN.define(true, false, false, function (attribute) {
      var _pass = true

      // Single Attribute Validation
      if (attribute) {
        if (this.validators.hasOwnProperty(attribute)) {
          for (i = 0; i < this.validators[attribute].length; i++) {
            if (!me.validators[attribute][i](me[attribute])) {
              me.invalidDataAttributes.indexOf(attribute) < 0 && me.invalidDataAttributes.push(attribute)
              return false
            }
          }
          return true
        }
      }

      // Validate All Attributes
      for (var rule in this.validators) {
        if (this[rule]) {
          if (this.validators.hasOwnProperty(rule)) {
            var pass = true
            for (var i = 0; i < this.validators[rule].length; i++) {
              pass = this.validators[rule][i](this[rule])
              if (!pass) {
                break
              }
            }
            if (!pass && this.invalidDataAttributes.indexOf(rule) < 0) {
              this.invalidDataAttributes.push(rule)
            }

            if (_pass && !pass) {
              _pass = false
            }
          }
        }
      }

      return true
    }),

    valid: NGN._get(function () {
      return this.invalidDataAttributes.length === 0
    }),

    /**
     * @property datafields
     * Provides an array of data fields associated with the model.
     * @returns {String[]}
     */
    datafields: NGN._get(function () {
      return Object.keys(this.fields)
    }),

    /**
       * @method
       * Provides specific detail/configuration about a field.
       * @param {String} fieldname
       * The name of the data field.
       * @returns {Object}
       */
    getDataField: NGN.define(true, false, false, function (fieldname) {
      return this.fields[fieldname]
    }),

    /**
     * @method
     * Indicates a data field exists.
     * @param {String} fieldname
     * The name of the data field.
     * @returns {Boolean}
     */
    hasDataField: NGN.define(true, false, false, function (fieldname) {
      return this.fields.hasOwnProperty(fieldname)
    }),

    /**
      * @property data
      * Creates a JSON representation of the data entity. This is
      * a record that can be persisted to a database or other data store.
      * @readonly.
      */
    data: NGN._get(function () {
      var d = this.serialize()
      if (this.dataMap) {
        // Loop through the map keys
        Object.keys(this.dataMap).forEach(function (key) {
          // If the node contains key, make the mapping
          if (d.hasOwnProperty(key)) {
            d[me.dataMap[key]] = d[key]
            delete d[key]
          }
        })
      }
      return d
    }),

    /**
      * @method serialize
      * Creates a JSON data object with no functions. Only uses enumerable attributes of the object by default.
      * Specific data values can be included/excluded using #enumerableProperties & #nonEnumerableProperties.
      *
      * Any object property that begins with a special character will be ignored by default. Functions & Setters are always
      * ignored. Getters are evaluated recursively until a simple object type is found or there are no further nested attributes.
      *
      * If a value is an instance of NGN.model.Model (i.e. a nested model or array of models), reference string is returned in the data.
      * The model itself can be returned using #getXRef.
      * @param {Object} [obj]
      * Defaults to this object.
      * @protected
      */
    serialize: NGN.define(false, false, false, function (obj) {
      var _obj = obj || this.raw
      var rtn = {}

      for (var key in _obj) {
        _obj.nonEnumerableProperties = _obj.nonEnumerableProperties || ''
        if (this.fields.hasOwnProperty(key)) {
          key = key === 'id' ? this.idAttribute : key
          if ((_obj.hasOwnProperty(key) && (_obj.nonEnumerableProperties.indexOf(key) < 0 && /^[a-z0-9 ]$/.test(key.substr(0, 1)))) || (_obj[key] !== undefined && _obj.enumerableProperties.indexOf(key) >= 0)) {
            var dsc = Object.getOwnPropertyDescriptor(_obj, key)
            if (!dsc.set) {
              // Handle everything else
              switch (typeof dsc.value) {
                case 'function':
                  // Support date & regex proxies
                  if (dsc.value.name === 'Date') {
                    rtn[key] = _obj[key].refs.toJSON()
                  } else if (dsc.value.name === 'RegExp') {
                    rtn[key] = dsc.value()
                  }
                  break
                case 'object':
                  // Support array proxies
                  if (_obj[key] instanceof Array && !Array.isArray(_obj[key])) {
                    _obj[key] = _obj[key].slice(0)
                  }

                  rtn[key] = _obj[key]
                  break
                default:
                  rtn[key] = _obj[key]
                  break
              }
            }
          }
        }
      }

      return rtn
    }),

    /**
     * @method addField
     * Add a data field after the initial model definition.
     * @param {string|object} field
     * The name of a field or a field configuration (see cfg#fields for syntax).
     * @param {boolean} [suppressEvents=false]
     * Set to `true` to prevent events from firing when the field is added.
     */
    addField: NGN.define(true, false, false, function (field, suppressEvents) {
      suppressEvents = suppressEvents !== undefined ? suppressEvents : false
      if (field.toLowerCase() !== 'id') {
        if (typeof field === 'object') {
          if (!field.name) {
            throw new Error('Cannot create data field. The supplied configuration does not contain a unique data field name.')
          }
          var cfg = field
          field = cfg.name
          delete cfg.name
        }

        if (me[field] !== undefined) {
          console.warn(field + ' data field defined multiple times. Only the last defintion will be used.')
          delete me[field]
        }

        // Create the data field as an object attribute & getter/setter
        me.fields[field] = cfg || me.fields[field] || {}
        me.fields[field].required = NGN.coalesce(me.fields[field].required, false)
        me.fields[field].type = NGN.coalesce(me.fields[field].type, String)
        me.fields[field].default = NGN.coalesce(me.fields[field]['default'], null)
        me.raw[field] = me.fields[field]['default']
        me[field] = me.raw[field]

        Object.defineProperty(me, field, {
          get: function () {
            return me.raw[field]
          },
          set: function (value) {
            var old = me.raw[field]
            me.raw[field] = value
            var c = {
              action: 'update',
              field: field,
              old: old,
              new: me.raw[field]
            }
            this.changelog.push(c)
            this.emit('field.update', c)
            if (!me.validate(field)) {
              me.emit('field.invalid', {
                field: field
              })
            }
          }
        })

        if (!suppressEvents) {
          var c = {
            action: 'create',
            field: field
          }
          this.changelog.push(c)
          this.emit('field.create', c)
        }

        // Add field validators
        if (me.fields.hasOwnProperty(field)) {
          if (me.fields[field].hasOwnProperty('pattern')) {
            me.addValidator(field, me.fields[field].pattern)
          }
          ['min', 'max', 'enum'].forEach(function (v) {
            if (me.fields[field].hasOwnProperty(v)) {
              me.addValidator(field, function (val) {
                return me._nativeValidators[v](me.fields[field], val)
              })
            }
          })
          if (me.fields[field].hasOwnProperty('required')) {
            if (me.fields[field].required) {
              me.addValidator(field, function (val) {
                return me._nativeValidators.required(val)
              })
            }
          }
          if (me.fields[field].hasOwnProperty('validate')) {
            if (typeof me.fields[field] === 'function') {
              me.addValidator(field, function (val) {
                return me.fields[field](val)
              })
            } else {
              console.warn('Invalid custom validation function. The value passed to the validate attribute must be a function.')
            }
          }
        }
      }
    }),

    /**
     * @method removeField
     * Remove a field from the data model.
     * @param {string} name
     * Name of the field to remove.
     */
    removeField: NGN.define(true, false, false, function (name) {
      if (this.raw.hasOwnProperty(name)) {
        var val = this.raw[name]
        delete this[name]
        delete this.fields[name] // eslint-disable-line no-undef
        delete this.raw[name] // eslint-disable-line no-undef
        if (this.invalidDataAttributes.indexOf(name) >= 0) {
          this.invalidDataAttributes.splice(this.invalidDataAttributes.indexOf(name), 1)
        }
        var c = {
          action: 'delete',
          field: name,
          value: val
        }
        this.emit('field.delete', c)
        this.changelog.push(c)
      }
    }),

    /**
     * @method history
     * Get the history of the entity (i.e. changelog).The history
     * is shown from most recent to oldest change. Keep in mind that
     * some actions, such as adding new custom fields on the fly, may
     * be triggered before other updates.
     * @returns {array}
     */
    history: NGN._get(function () {
      return this.changelog.reverse()
    }),

    /**
     * @method undo
     * A rollback function to undo changes. This operation affects
     * the changelog. It is possible to undo an undo (i.e. redo).
     * @param {number} [OperationCount=1]
     * The number of operations to "undo". Defaults to a single operation.
     */
    undo: NGN.define(true, false, false, function (back) {
      back = back || 1
      var old = this.changelog.splice(this.changelog.length - back, back)

      old.reverse().forEach(function (change) {
        switch (change.action) {
          case 'update':
            me[change.field] = change.old
            break
          case 'create':
            me.removeField(change.field)
            break
          case 'delete':
            me.addField(change.field)
            me[change.field] = me.old
            break
        }
      })
    }),

    /**
     * @method load
     * Load a data record. This clears the #history. #modified
     * will be set to `false`, as though the record has been untouched.
     * @param {object} data
     * The data to apply to the model.
     */
    load: NGN.define(true, false, false, function (data) {
      data = data || {}

      // Handle data maps
      if (this._dataMap !== null) {
        Object.keys(this.reverseMap).forEach(function (key) {
          if (data.hasOwnProperty(key)) {
            data[me.reverseMap[key]] = data[key]
            delete data[key]
          }
        })
      }

      // Loop through the keys and add data fields
      Object.keys(data).forEach(function (key) {
        if (me.raw.hasOwnProperty(key)) {
          me.raw[key] = data[key]
        } else if (key === me.idAttribute) {
          me.id = data[key]
        } else {
          console.warn(key + ' was specified as a data field but is not defined in the model.')
        }
      })

      this.setUnmodified()
    })
  })

  // Make sure an ID reference is available.
  if (!this.fields.hasOwnProperty('id')) {
    config.fields.id = {
      required: true,
      type: String,
      'default': config.id || null
    }
  }

  // Add fields
  Object.keys(this.fields).forEach(function (field) {
    me.addField(field, true)
  })
}

window.NGN.DATA.Model = function (cfg) {
  var Model = function (data) {
    this.constructor(cfg)
    if (data) {
      this.load(data)
    }
  }

  // Model.prototype = NGN.DATA.Entity.prototype
  NGN.DATA.util.inherit(NGN.DATA.Entity, Model)

  return Model
}

NGN.DATA.util.inherit(NGN.DATA.util.EventEmitter, NGN.DATA.Entity)

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

'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.Proxy
 * Provides a gateway to remote services such as HTTP and
 * websocket endpoints. This can be used directly to create
 * custom proxies. However; NGN.DATA.HttpProxy and NGN.DATA.WebSocketProxy
 * are also available for use.
 */
if (NGN.HTTP) {
  window.NGN.DATA.Proxy = function (cfg) {
    cfg = cfg || {}

    if (!cfg.store) {
      throw new Error('NGN.DATA.Proxy requires a NGN.DATA.Store.')
    }

    cfg.store.proxy = this

    Object.defineProperties(this, {
      /**
       * @cfgproperty {NGN.DATA.Store} store (required)
       * THe store for data being proxied.
       */
      store: NGN.define(true, false, false, cfg.store),

      /**
       * @cfgproperty {string} [url=http://localhost
       * The root URL for making network requests (HTTP/WS/TLS).
       */
      url: NGN.define(true, true, false, cfg.url || 'http://localhost'),

      /**
       * @cfg {string} username
       * If using basic authentication, provide this as the username.
       */
      username: NGN.define(true, true, false, cfg.username || null),

      /**
       * @cfg {string} password
       * If using basic authentication, provide this as the password.
       */
      password: NGN.define(true, true, false, cfg.password || null),

      /**
       * @cfg {string} token
       * If using an access token, provide this as the value. This
       * will override basic authentication (#username and #password
       * are ignored). This sets an `Authorization: Bearer <token>`
       * HTTP header.
       */
      token: NGN.define(true, true, false, cfg.token || null),

      /**
       * @property actions
       * A list of the record changes that have occurred.
       * @returns {object}
       * An object is returned with 3 keys representative of the
       * action taken:
       *
       * ```js
       * {
       *   create: [NGN.DATA.Model, NGN.DATA.Model],
       *   update: [NGN.DATA.Model],
       *   delete: []
       * }
       * ```
       *
       * The object above indicates two records have been created
       * while one record was modified and no records were deleted.
       * **NOTICE:** If you add or load a JSON object to the store
       * (as opposed to adding an instance of NGN.DATA.Model), the
       * raw object will be returned. It is also impossible for the
       * data store/proxy to determine if these have changed since
       * the NGN.DATA.Model is responsible for tracking changes to
       * data objects.
       * @private
       */
      actions: NGN._get(function () {
        return {
          create: cfg.store._created,
          update: cfg.store.records.filter(function (record) {
            if (cfg.store._created.indexOf(record) < 0 && cfg.store._deleted.indexOf(record) < 0) {
              return false
            }
            return record.modified
          }).map(function (record) {
            return record
          }),
          delete: cfg.store._deleted
        }
      }),

      save: NGN.define(true, false, true, function () {}),
      fetch: NGN.define(true, false, true, function () {})
    })
  }
  NGN.DATA.util.inherit(NGN.DATA.util.EventEmitter, NGN.DATA.Proxy)
} else {
  throw new Error('NGN.DATA.Proxy requires NGN.HTTP.')
}
