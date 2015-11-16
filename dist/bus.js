/**
  * Generated on: Sun Nov 15 2015 20:24:42 GMT-0600 (CST)
  * Copyright (c) 2014-2015, Corey Butler. All Rights Reserved.
  */
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
     * the event is detected. The handler/listener is removed after it is executed.
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

      var execListeners = function (_t) {
        if (_t !== null) {
          _t.forEach(function (item) {
            item(info !== undefined ? info : {})
          })
        }
      }

      // Execute any listeners using a wildcard event match.
      var execWildcardListeners = function (_t, map) {
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
            fn(info !== undefined ? info : {})
          })
        })
      }

      // Cycle through topics and execute standard listeners
      execListeners(t)

      // Cycle through one-off topics and execute listeners
      if (ot !== null) {
        ot.forEach(function (item) {
          item(info !== undefined ? info : {})
        })
        oneoff = oneoff.filter(function (_t) {
          return _t[0].toLowerCase() !== topic.toLowerCase()
        })
      }

      // Cycle through bubble listeners
      execListeners(b)
      execWildcardListeners(topics)

      // Execute any one-off listeners using a wildcard event match.
      execWildcardListeners(oneoff)
      oneoff = oneoff.filter(function (t) {
        if (t[0].indexOf('*') >= 0) {
          var re = new RegExp(t[0].replace('*', '.*', 'gi'))
          return !re.test(topic)
        }
        return true
      })

      // Trigger any bubbled events using a wildcard
      execWildcardListeners(oneoff, false)
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
