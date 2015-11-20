/**
  * v1.0.8 generated on: Fri Nov 20 2015 14:27:53 GMT-0600 (CST)
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
      document.getElementsByTagName('head')[0].appendChild(s)
      callback && callback()
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
  var str = document.createTextNode('img[src$=".svg"]{display:none}svg.loading{height:0px !importantwidth:0px !important}')
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
          // Original Browser-Based Vanilla JS using the AJAX lib.
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

/**
 * @class NGN.DATA.Model
 * A data model.
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
    fields: NGN.define(false, true, true, config.fields || {
      /**
       * @datafield {string} [id=null]
       * The unique ID of the person.
       */
      id: {
        required: true,
        type: String,
        'default':	config.id || null
      }
    }),

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
      return this.changelog.length > 0
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
        this[this.idAttribute] = value
        this.oid = value
      }
    },

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
     * @cfg {Object} dataMap
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
    dataMap: NGN.define(true, true, false, config.dataMap || null),

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
          NGN.emit('validator.add', property)
          break
        case 'object':
          if (Array.isArray(validator)) {
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.indexOf(value) >= 0
            })
            NGN.emit('validator.add', property)
          } else if (validator.test) { // RegExp
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.test(value)
            })
            NGN.emit('validator.add', property)
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
          NGN.emit('validator.add', property)
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
        NGN.emit('validator.remove', attribute)
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
      var me = this

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
      var list = []
      for (var field in this.fields) {
        list.push(field)
      }
      return list
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
      * @property record
      * Creates a JSON representation of the data entity. This is
      * a record that can be persisted to a database or other data store.
      * @readonly.
      */
    record: NGN._get(function () {
      var d = this.serialize()
      if (this.dataMap) {
        // Loop through the map keys
        var me = this
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
      var me = this
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
            NGN.emit('field.update', c)
            if (!me.validate(field)) {
              NGN.emit('field.invalid', {
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
          NGN.emit('field.create', c)
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
        NGN.emit('field.delete', c)
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
      var me = this

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
     * Load a data record.
     * @param {object} data
     * The data to apply to the model.
     */
    load: NGN.define(true, false, false, function (data) {
      var me = this
      data = data || {}
      Object.keys(data).forEach(function (key) {
        if (me.raw.hasOwnProperty(key)) {
          me.raw[key] = data[key]
        } else {
          console.warn(key + ' was specified as a data field but is not defined in the model.')
        }
      })
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
  var fn = function (data) {
    this.constructor(cfg)
    if (data) {
      this.load(data)
    }
  }

  fn.prototype = NGN.DATA.Entity.prototype

  return fn
}

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
