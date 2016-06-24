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
NGN.extend('BUS', NGN.const(new EventEmitter()))

// window.NGN.BUS = (function () {
//   var topics = []
//   var oneoff = []
//   var bubble = []
//   var obj = {}
//
//   var _getTopic = function (arr, topic) {
//     var t = arr.filter(function (t) {
//       return topic.toLowerCase() === t[0].toLowerCase()
//     })
//     if (t.length === 0) {
//       return null
//     }
//     if (t.length > 1) {
//       console.warn('NGN Event Bus: ' + t[0][0] + ' exists more than once.')
//     }
//     return t[0].filter(function (el, i) {
//       return i !== 0
//     })
//   }
//
//   var getTopic = function (topic) {
//     return _getTopic.apply(this, [topics, topic])
//   }
//
//   var getOneOffTopic = function (topic) {
//     return _getTopic.apply(this, [oneoff, topic])
//   }
//
//   var getBubble = function (topic) {
//     return _getTopic.apply(this, [bubble, topic])
//   }
//
//   var validInput = function (topic, listener) {
//     return topic === null || topic === undefined || listener === null || listener === undefined
//   }
//
//   Object.defineProperties(obj, {
//     /**
//      * @method subscribe
//      * Subscribe to an event.
//      * @param {string} event
//      * The event name.
//      * @param {Function} listener
//      * The callback for handling an event.
//      * @param {any} [listener.data=null]
//      * A data payload supplied by the event.
//      */
//     subscribe: NGN.define(true, false, false, function (topic, listener) {
//       // Validate input
//       if (validInput(topic, listener)) {
//         throw new Error('subscribe() requires a topic and listener function as arguments.')
//       }
//
//       // Create the topic if not yet created
//       var t = getTopic(topic)
//       t !== null && t.unshift(topic)
//       t === null && (t = [topic]) && topics.push(t)
//       // Add the listener to queue
//       var index = t.push(listener)
//
//       // Update the topic with the new queue
//       topics[topics.map(function (row) { return row[0] }).indexOf(topic)] = t
//
//       // Provide handle back for removal of topic
//       return {
//         unsubscribe: function () {
//           t = t.splice(index, 1)
//           if (t.length === 0) {
//             topics.splice(topics.map(function (row) { return row[0] }).indexOf(topic), 1)
//           } else {
//             topics[topics.map(function (row) { return row[0] }).indexOf(topic)] = t
//           }
//         }
//       }
//     }),
//
//     /**
//      * @method subscribeOnce
//      * Subscribe to an event. The handler/listener will only be executed the first time
//      * the event is detected, then it is removed after it is executed.
//      * @type {Object}
//      */
//     subscribeOnce: NGN.define(true, false, false, function (topic, listener) {
//       // Validate input
//       if (validInput(topic, listener)) {
//         throw new Error('subscribeOnce() requires a topic and listener function as arguments.')
//       }
//
//       // Create the topic if not yet created
//       var t = getOneOffTopic(topic)
//       t !== null && t.unshift(topic)
//       t === null && (t = [topic]) && oneoff.push(t)
//
//       // Add the listener
//       t.push(listener)
//
//       // Update the topic with the new queue
//       oneoff[oneoff.map(function (row) { return row[0] }).indexOf(topic)] = t
//     }),
//
//     /**
//      * @method on
//      * Alias for #subscribe.
//      */
//     on: NGN.define(true, false, false, function () {
//       return this.subscribe.apply(this, arguments)
//     }),
//
//     /**
//      * @method once
//      * Alias for #subscribeOnce.
//      */
//     once: NGN.define(true, false, false, function () {
//       return this.subscribeOnce.apply(this, arguments)
//     }),
//
//     /**
//      * @method bind
//      * A special subscriber that fires one or more event in response to
//      * to an event. This is used to bubble events up/down an event chain.
//      *
//      * For example:
//      *
//      * ```js
//      * BUS.bind('sourceEvent', ['someEvent','anotherEvent'], {payload:true})
//      * ```
//      * When `sourceEvent` is published, the bind method triggers `someEvent` and
//      * `anotherEvent`, passing the payload object to `someEvent` and
//      * `anotherEvent` subscribers simultaneously.
//      *
//      * @param {String} sourceEvent
//      * The event to subscribe to.
//      * @param {String|Array} triggeredEvent
//      * An event or array of events to fire in response to the sourceEvent.
//      * @returns {Object}
//      * Returns an object with a single `remove()` method.
//      */
//     bind: NGN.define(true, false, true, function (topic, trigger, meta) {
//       trigger = typeof trigger === 'string' ? [trigger] : trigger
//
//       // Create the topic if not yet created
//       var t = getBubble(topic)
//       t !== null && t.unshift(topic)
//       t === null && (t = [topic]) && bubble.push(t)
//
//       var me = this
//       var listener = function (info) {
//         trigger.forEach(function (tEvent) {
//           me.publish(tEvent, info !== undefined ? info : {})
//         })
//       }
//
//       // Add the listener to queue
//       var index = t.push(listener)
//
//       // Update the topic with the new queue
//       bubble[bubble.map(function (row) { return row[0] }).indexOf(topic)] = t
//
//       // Provide handle back for removal of topic
//       return {
//         remove: function () {
//           t = t.splice(index, 1)
//           if (t.length === 0) {
//             bubble.splice(bubble.map(function (row) { return row[0] }).indexOf(topic), 1)
//           } else {
//             bubble[bubble.map(function (row) { return row[0] }).indexOf(topic)] = t
//           }
//         }
//       }
//     }),
//
//     // Execute any listeners using a wildcard event match.
//     execWildcardListeners: NGN.define(false, false, false, function (topic, info, _t, map, multiarg) {
//       var scope = {
//         eventName: topic
//       }
//       map = map === undefined ? true : map
//       _t = _t.filter(function (t) {
//         if (t[0].indexOf('*') >= 0) {
//           var re = new RegExp(t[0].replace('*', '.*', 'gi'))
//           return re.test(topic)
//         }
//         return false
//       })
//       if (map) {
//         _t = _t.map(function (arr) {
//           return arr.slice(1, arr.length)
//         })
//       }
//       _t.forEach(function (t) {
//         t.forEach(function (fn) {
//           if (multiarg) {
//             fn.apply(scope, info)
//           } else {
//             fn.call(scope, info !== undefined ? info : {})
//           }
//         })
//       })
//     }),
//
//     execListeners: NGN.define(false, false, false, function (topic, info, _t, multiarg) {
//       var scope = {
//         eventName: topic
//       }
//       if (_t !== null) {
//         _t.forEach(function (item) {
//           if (multiarg) {
//             item.apply(scope, info)
//           } else {
//             item.call(scope, info !== undefined ? info : {})
//           }
//         })
//       }
//     }),
//
//     /**
//      * @method publish
//      * Publish/trigger/fire an event.
//      * @param {String} event
//      * The event to fire.
//      * @param {any} data
//      * The payload to send to any event listeners/handlers.
//      */
//     publish: NGN.define(true, false, false, function (topic, info) {
//       var t = getTopic(topic)
//       var ot = getOneOffTopic(topic)
//       var b = getBubble(topic)
//       var multiarg = arguments.length > 2
//
//       if (multiarg) {
//         info = NGN._slice(arguments)
//         if (info[0] === topic) {
//           info.shift() // remove the topic name
//         }
//       }
//
//       // Cycle through topics and execute standard listeners
//       this.execListeners(topic, info, t, multiarg)
//
//       // Cycle through one-off topics and execute listeners
//       if (ot !== null) {
//         oneoff = oneoff.filter(function (_t) {
//           return _t[0].toLowerCase() !== topic.toLowerCase()
//         })
//         this.execListeners(topic, info, ot, multiarg)
//       }
//
//       // Cycle through bubble listeners
//       this.execListeners(topic, info, b, multiarg)
//       this.execWildcardListeners(topic, info, topics, true, multiarg)
//
//       // Execute any one-off listeners using a wildcard event match.
//       this.execWildcardListeners(topic, info, oneoff, true, multiarg)
//       oneoff = oneoff.filter(function (t) {
//         if (t[0].indexOf('*') >= 0) {
//           var re = new RegExp(t[0].replace('*', '.*', 'gi'))
//           return !re.test(topic)
//         }
//         return true
//       })
//
//       // Trigger any bubbled events using a wildcard
//       this.execWildcardListeners(topic, info, oneoff, false, multiarg)
//     }),
//
//     /**
//      * @method clear
//      * Remove all handlers for an event.
//      * @param {String} event
//      * The event to trigger.
//      */
//     clear: NGN.define(false, false, false, function (topic) {
//       var filter = function (a) {
//         return a.filter(function (t) {
//           return t[0].toLowerCase() !== topic.toLowerCase()
//         })
//       }
//       topics = filter(topics)
//       oneoff = filter(oneoff)
//       bubble = filter(bubble)
//     }),
//
//     /**
//      * @method emit
//      * An alias for #publish.
//      */
//     emit: NGN.define(true, false, false, function () {
//       return this.publish.apply(this, arguments)
//     }),
//
//     /**
//      * @property {Object} subscribers
//      * An array of all subscribers which currently have a registered event handler.
//      */
//     subscribers: NGN._get(function () {
//       var sum = {}
//       topics.forEach(function (t) {
//         sum[t[0]] = {
//           persist: t.length - 1,
//           adhoc: 0
//         }
//       })
//       oneoff.forEach(function (t) {
//         sum[t[0]] = sum[t[0]] || {
//           persist: 0
//         }
//         sum[t[0]].adhoc = t.length - 1
//       })
//
//       return sum
//     }),
//
//     /**
//      * @property {Array} persistentSubscribers
//      * All subscribers with a persistent (i.e. normal) registered event handler.
//      */
//     persistentSubscribers: NGN._get(function () {
//       return topics.map(function (t) {
//         return t[0]
//       }).sort()
//     }),
//
//     /**
//      * @property {Array} adhocSubscribers
//      * All subscribers with a one-time registered event handler. The handlers of events
//      * are removed after the first time the event is heard by the BUS.
//      */
//     adhocSubscribers: NGN._get(function () {
//       return oneoff.map(function (t) {
//         return t[0]
//       }).sort()
//     }),
//
//     /**
//      * @property {Array} autoSubscribers
//      * All subscribers established using the #bind method.
//      */
//     autoSubscribers: NGN._get(function () {
//       return bubble.map(function (t) {
//         return t[0]
//       }).sort()
//     }),
//
//     /**
//      * @method pool
//      * A helper command to create multiple related subscribers
//      * all at once. This is a convenience function.
//      * @property {string} [prefix]
//      * Supply a prefix to be added to every event. For example,
//      * `myScope.` would turn `someEvent` into `myScope.someEvent`.
//      * @property {Object} subscriberObject
//      * A key:value object where the key is the name of the
//      * unprefixed event and the key is the handler function.
//      * @property {Function} [callback]
//      * A callback to run after the entire pool is registered. Receives
//      * a single {Object} argument containing all of the subscribers for
//      * each event registered within the pool.
//      */
//     pool: NGN.define(true, false, false, function (prefix, obj, callback) {
//       if (typeof prefix !== 'string') {
//         obj = prefix
//         prefix = ''
//       }
//
//       var me = this
//       var pool = {}
//
//       Object.keys(obj).forEach(function (e) {
//         if (typeof obj[e] === 'function') {
//           pool[e] = me.subscribe((prefix.trim() || '') + e, obj[e])
//         } else {
//           console.warn((prefix.trim() || '') + e + ' could not be pooled in the event bus because it\'s value is not a function.')
//         }
//       })
//
//       callback && callback(pool)
//     }),
//
//     /**
//      * @method attach
//      * Attach a function to a topic. This can be used
//      * to forward events in response to asynchronous functions.
//      *
//      * For example:
//      *
//      * ```js
//      * myAsyncDataFetch(BUS.attach('topicName'))
//      * ```
//      *
//      * This is the same as:
//      *
//      * ```js
//      * myAsyncCall(function (data) {
//      *   NGN.BUS.emit('topicName', data)
//      * })
//      * ```
//      * @param {string} topic
//      * Name of the topic to emit (destination topic).
//      * @param {boolean} [preventDefault=false]
//      * Setting this to `true` will prevent an event from performing it's
//      * default action.
//      *
//      * **Instead of using:**
//      *
//      * ```js
//      * NGN.ref.myDomReference.forward('click', function (e) {
//      *   e.preventDefault()
//      *   NGN.BUS.emit('some.event', e)
//      * })
//      * ```
//      *
//      * **Use this instead:**
//      *
//      * ```js
//      * NGN.ref.myDomReference.forward('click', NGN.BUS.attach('some.event', true))
//      * ```
//      *
//      * Both of the above examples provide the same functionality, but the second
//      * option simplifies the syntax.
//      * @returns {function}
//      */
//     attach: NGN.define(true, false, false, function (topic, preventDefaultAction) {
//       var me = this
//       preventDefaultAction = NGN.coalesce(preventDefaultAction, false)
//       return function (e) {
//         if (preventDefaultAction && e.hasOwnProperty('preventDefault')) {
//           e.preventDefault()
//         }
//         var args = NGN._slice(arguments)
//         args.unshift(topic)
//         me.publish.apply(me, args)
//       }
//     }),
//
//     /**
//      * @method queue
//      * This method waits for the specified duration, then publishes an
//      * event once. This will publish the event only once at the end of the
//      * wait period, even if the event is triggered multiple times. This can
//      * be useful when working with many events triggered in rapid succession.
//      *
//      * For example, an NGN.DATA.Model representing a person may be used to
//      * track a user profile. The NGN.DATA.Model fires an event called `field.update`
//      * every time a data field is modified. In many cases, a user may update
//      * multiple fields of their profile using a form with a "Save" button.
//      * Instead of generating a new "save" (to disk, to memory, to an API, etc)
//      * operation for each field, the publishOnce event can wait until all
//      * changes are made before running the save operation.
//      *
//      * ```js
//      * // Create a data model representing a person.
//      * var Person = new NGN.DATA.Model({....})
//      *
//      * // Create a new person record for a user.
//      * var user = new Person()
//      *
//      * // When the user is modified, save the data.
//      * user.on('field.update', function () {
//      * 	 // Wait 300 milliseconds to trigger the save event
//      *   NGN.BUS.queue('user.save', 300)
//      * })
//      *
//      * // Save the user using an API
//      * NGN.BUS.on('user.save', function () {
//      * 	 NGN.HTTP.put({
//      * 	   url: 'https://my.api.com/user',
//      * 	   json: user.data
//      * 	 })
//      * })
//      *
//      * // Modify the record attributes (which are blank by default)
//      * user.firstname = 'John'
//      * user.lastname = 'Doe'
//      * user.age = 42
//      *
//      * // Make another update 1 second later
//      * setTimeout(function () {
//      *   user.age = 32
//      * }, 1000)
//      * ```
//      *
//      * The code above sets up a model and record. Then it listens to the record
//      * for field updates. Each time it recognizes an update, it queues the "save"
//      * event. When the queue matures, it fires the `user.save` event.
//      *
//      * The first `field.update` is triggered when `user.firstname = 'John'` runs.
//      * This initiates a queue for `user.save`, set to mature in 300 millisenconds.
//      * Next, a `field.update` is triggered when `user.lastname = 'Doe'` runs.
//      * This time, since the queue for `user.save` is already initiated, notthing
//      * new happens. Finally, a `field.update` is triggered when `user.age = 42`
//      * runs. Just like the last one, nothing happens since the `user.save` queue
//      * is already active.
//      *
//      * The `user.save` queue "matures" after 300 milliseconds. This means after
//      * 300 milliseconds have elapsed, the `user.save` event is triggered. In this
//      * example, it means the `NGN.HTTP.put()` code will be executed. As a result,
//      * all 3 change (firstname, lastname, and age) will be complete before the
//      * API request is executed. The queue is cleared immediately.
//      *
//      * The final update occurs 1 second later (700 milliseconds after the queue
//      * matures). This triggers a `field.update`, but since the queue is no
//      * longer active, it is re-initiated. 300 milliseconds later, the `user.save`
//      * event is fired again, thus executing the API request again (1.3 seconds
//      * in total).
//      * @param {string} topic
//      * The event/topic to publish/emit.
//      * @param {Number} [delay=300]
//      * The number of milliseconds to wait before firing the event.
//      * @param {Any} [payload]
//      * An optional payload, such as data to be passed to an event handler.
//      */
//     queue: NGN.define(true, false, false, function (topic, delay, payload) {
//       if (typeof delay !== 'number' && !payload) {
//         payload = delay
//         delay = 300
//       } else {
//         delay = delay || 300
//       }
//       if (!this._queue.hasOwnProperty(topic)) {
//         var me = this
//         this._queue = setTimeout(function () {
//           delete me._queue[topic]
//           me.publish(topic, payload)
//         }, delay)
//       }
//     }),
//
//     _queue: NGN.define(false, true, false, {})
//
//   })
//   return obj
// })()
