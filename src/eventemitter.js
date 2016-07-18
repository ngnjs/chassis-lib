'use strict'

if (!window.NGN) {
  throw new Error('The EventEmitter class is dependent on the presence of NGN.')
}

/**
 * @class EventEmitter
 * This is an extendable generic class used to apply event management
 * to non-DOM objects, such as data models, logging, and other common
 * elements of JavaScript programming.
 * @protected
 */
class EventEmitter {
  /**
   * @constructor
   * ```
   * let EE = new EventEmitter()
   * ```
   * This is a protected class. It is most commonly instantiated through
   * the NGN namespace (i.e. `new NGN.EventEmitter()`). However; it is
   * designed for use within the NGN library, not directly as an event emitter.
   * Use with caution.
   */
  constructor (cfg) {
    cfg = cfg || {}
    Object.defineProperties(this, {
      handlers: NGN.private({}),
      adhoc: NGN.private({}),
      maxlisteners: NGN.private(cfg.defaultMaxListeners || 10)
    })
  }

  /**
   * @property {object} subscribers
   * An array of all subscribers which currently have a registered event handler.
   * @warning This is a UI-only method.
   */
  get subscribers () {
    let subscriberList = {}

    for (let eventName in this.handlers) {
      subscriberList[eventName] = {
        handler: this.handlers[eventName].length,
        adhoc: 0
      }
    }

    for (let eventName in this.adhoc) {
      subscriberList[eventName] = subscriberList[eventName] || {
        handler: 0
      }

      subscriberList[eventName].adhoc = this.adhoc[eventName].length
    }

    return subscriberList
  }

  /**
   * @property defaultMaxListeners
   * The maximum number of listeners for a single event.
   */
  get defaultMaxListeners () {
    return this.maxlisteners
  }

  set defaultMaxListeners (value) {
    this.maxlisteners = value
  }

  /**
   * @method {number} listenerCount
   * The number of listeners for a specific event.
   * @param {string} eventName
   * The name of the event to count listeners for.
   */
  listenerCount (eventName) {
    return (this.handlers[eventName] || []).length +
      (this.adhoc[eventName] || []).length
  }

  /**
   * @method getMaxListeners
   * A node-like reference to the #defaultMaxListeners value.
   * @return {number}
   */
  getMaxListeners () {
    return this.defaultMaxListeners
  }

  /**
   * @method setMaxListeners
   * A node-like reference to the #defaultMaxListeners value (setter).
   */
  setMaxListeners (value) {
    this.defaultMaxListeners = value
  }

  /**
   * @method eventNames
   * A node-like reference providing an array of recognized event names.
   * @return {array}
   */
  eventNames () {
    let handlers = Object.keys(this.handlers)
    let adhoc = Object.keys(this.adhoc)
    return NGN.dedupe(handlers.concat(adhoc))
  }

  /**
   * @method listeners
   * Returns the raw listener methods for the event.
   * @param {string} eventName
   * Name of the event to retrieve listeners for.
   * @return {array}
   */
  listeners (eventName) {
    let handlers = this.handlers[eventName] || []
    let adhoc = this.adhoc[eventName] || []
    return handlers.concat(adhoc)
  }

  /**
   * @method on
   * Create a new event handler for the specified event.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   * @param {boolean} [prepend=false]
   * When set to `true`, the event is added to the beginning of
   * the processing list instead of the end.
   */
  on (eventName, callback, prepend) {
    this.handlers[eventName] = this.handlers[eventName] || []
    this.handlers[eventName][NGN.coalesce(prepend, false) ? 'unshift' : 'push'](callback)
    this.emit('newListener', eventName, callback)
    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method addListener
   * A node-like reference to the #on method.
   */
  addListener () {
    this.on.apply(this, arguments)
  }

  /**
   * @method prependListener
   * A node-like reference to the #on method, adding events to the
   * beginning of the event list (processed before others) instead of the end.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   */
  prependListener () {
    const args = NGN.slice(arguments).push(true)
    this.on.apply(this, args)
  }

  /**
   * @method on
   * Create a new event handler for the specified event. The
   * handler will be removed immediately after it is executed. This
   * effectively listens for an event to happen once and only once
   * before the handler is destroyed.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   * @param {boolean} [prepend=false]
   * When set to `true`, the event is added to the beginning of
   * the processing list instead of the end.
   */
  once (eventName, callback, prepend) {
    this.adhoc[eventName] = this.adhoc[eventName] || []
    this.adhoc[eventName][NGN.coalesce(prepend, false) ? 'unshift' : 'push'](callback)
    this.emit('newListener', eventName, callback)
    if (this.listenerCount(eventName) > this.maxlisteners) {
      throw new Error('Maximum event listeners exceeded. Use setMaxListeners() to adjust the level.')
    }
  }

  /**
   * @method prependOnceListener
   * A node-like reference to the #once method, adding events to the
   * beginning of the event list (processed before others) instead of the end.
   * @param  {string} eventName
   * Name of the event to listen for.
   * @param  {Function} handler
   * The method responsible for responding to the event.
   */
  prependOnceListener () {
    const args = NGN.slice(arguments).push(true)
    this.once.apply(this, args)
  }

  /**
   * @method off
   * Remove an event handler. If no handler is specified, all handlers for
   * the specified event will be removed.
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} [handlerFn]
   * The handler function to remove from the event handlers.
   */
  off (eventName, callback) {
    if (this.handlers[eventName]) {
      if (!callback) {
        delete this.handlers[eventName]
        return
      }

      let position = this.handlers[eventName].indexOf(callback)

      while (position >= 0) {
        this.handlers[eventName].splice(position, 1)
        this.emit('removeListener', eventName, callback)
        position = this.handlers[eventName].indexOf(callback)
      }

      if (this.handlers[eventName].length === 0) {
        delete this.handlers[eventName]
      }
    }
  }

  /**
   * @method onceoff
   * Remove an event handler that was originally created using #once. If no
   * handler is specified, all handlers for the spcified event will be removed.
   * @param {string} eventName
   * Name of the event to remove.
   * @param {function} handlerFn
   * The handler function to remove from the event handlers.
   */
  onceoff (eventName, callback) {
    if (this.adhoc[eventName]) {
      if (!callback) {
        delete this.adhoc[eventName]
        return
      }

      let position = this.adhoc[eventName].indexOf(callback)

      while (position > 0) {
        this.adhoc.splice(position, 1)
        position = this.adhoc[eventName].indexOf(callback)
      }
      if (this.adhoc[eventName].length === 0) {
        delete this.adhoc[eventName]
      }
    }
  }

  /**
   * @alias removeListener
   * A node-like alias of the #off and #onceoff method (combined).
   */
  removeListener () {
    this.off.apply(this, arguments)
    this.onceoff.apply(this, arguments)
  }

  /**
   * @method clear
   * Remove all event handlers from the EventEmitter (both regular and adhoc).
   */
  clear () {
    this.handlers = {}
    this.adhoc = {}
  }

  /**
   * @alias removeAllListeners
   * A node-like alias of the #clear method.
   */
  removeAllListeners () {
    this.clear()
  }

  /**
   * @method emit
   * Fires an event. This method accepts one or more arguments. The
   * first argument is always the event name, followed by any number
   * of payload arguments.
   *
   * Example:
   * ```
   * const EE = new NGN.EventEmitter()
   *
   * EE.emit('someevent', {payload: 1}, {payload: 2})
   * ```
   * The example above triggers an event called `someevent` and applies
   * the remaining two arguments to any event handlers.
   * @param {string} eventName
   * The name of the event to trigger.
   */
  emit () {
    let args = NGN.slice(arguments)
    const eventName = args.shift()
    const events = this.getAllEvents(eventName)

    let scope = {
      event: eventName
    }

    for (let name in events) {
      let adhocEvent = this.adhoc[events[name]]
      // Adhoc event handling
      if (adhocEvent) {
        delete this.adhoc[events[name]]

        while (adhocEvent.length > 0) {
          let fn = adhocEvent.pop()
          scope.handler = fn
          fn.apply(scope, args)
        }
      }

      // Regular event handling
      let handler = this.handlers[events[name]]
      if (handler) {
        for (let fn in handler) {
          scope.handler = handler[fn]
          handler[fn].apply(scope, args)
        }
      }
    }
  }

  /**
   * @method getAllEvents
   * Returns all of the events that match an event name. The event name
   * may contain wildcards (i.e. `*`) or it can be a regular expression.
   * @param  {string|regexp} eventName
   * A string or regular expression defining which event names to identify.
   * A string value containing an asterisk (*) will be converted to a regular
   * expression for simplistic wildcard event handling purposes.
   * @return {array}
   * An array of unique event names with handlers or adhoc handlers.
   * @private
   */
  getAllEvents (eventName) {
    const regularEvents = Object.keys(this.handlers)
    const adhocEvents = Object.keys(this.adhoc)
    let allEvents = NGN.dedupe(regularEvents.concat(adhocEvents))

    allEvents = allEvents.filter(function (event) {
      // If the event is an exact match, don't filter it out.
      if (event === eventName) {
        return true
      }

      // If the event is a regexp/wildcard, further processing is necessary.
      if (NGN.typeof(event) === 'regexp' || event.indexOf('*') >= 0) {
        // Convert wildcard events to a regular expression.
        if (NGN.typeof(event) !== 'regexp') {
          event = new RegExp(event.replace('*', '.*', 'gi'))
        }
        // If the event name matches the event, keep it.
        return event.test(eventName)
      }

      // None of the criteria were met. Ignore the event.
      return false
    })

    return allEvents
  }
}

NGN.extend('EventEmitter', NGN.private(EventEmitter))
