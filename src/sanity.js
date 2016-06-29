/**
 * @layer SANITY
 * The sanity layer adds dummy checks around methods to make sure they are being called correctly throughout the application.
 * It is designed for development, and not meant to be included in production.
 */
NGN.SANITY = {}

Object.defineProperties(NGN.SANITY, {
  /**
   * @method isValid
   * Checks whether or not a method has been called correctly.
   * @private
   * @param {String} methodName The associated method name
   * @param {Array} args The arguments provided with the original method call
   * @returns  {Boolean} Whether or not the method has been called correctly
   *
   */
  isValid: NGN.privateconst(function (methodName, args) {
    switch (methodName) {
      case 'EE.emit':
        if (!args.length) {
          return this.warn('emit() called without any arguments. Did you mean to specify an event and payload?')
        }
        break
      case 'EE.listenerCount':
        if (!args.length) {
          return this.warn('listenerCount() called without any arguments. Did you mean to specify an event?')
        }
        break
      case 'EE.on':
        if (!args.length) {
          return this.warn('on() called without any arguments. Did you mean to specify an eventName and callback?')
        }
        break
      case 'EE.prependListener':
        if (!args.length) {
          return this.warn('prependListener() called without any arguments. Did you mean to specify an eventName and callback?')
        }
        break
      case 'EE.once':
        if (!args.length) {
          return this.warn('once() called without any arguments. Did you mean to specify an eventName and callback?')
        }
        break
      case 'EE.prependOnceListener':
        if (!args.length) {
          return this.warn('prependOnceListener() called without any arguments. Did you mean to specify an eventName and callback?')
        }
        break
      case 'EE.off':
        if (!args.length) {
          return this.warn('off() called without any arguments. Did you mean to specify an eventName?')
        }
        break
      case 'EE.onceoff':
        if (!args.length) {
          return this.warn('onceoff() called without any arguments. Did you mean to specify an eventName?')
        }
        break
      case 'EE.getAllEvents':
        if (!args.length) {
          return this.warn('getAllEvents() called without any arguments. Did you mean to specify an eventName?')
        }
        break
    }
    return true
  }),

  warn: NGN.privateconst(function (msg) {
    console.warn(msg)
    return false
  })
})

let original = {
  NGN: {
    EventEmitter: {
      emit: NGN.EventEmitter.prototype.emit,
      listenerCount: NGN.EventEmitter.prototype.listenerCount,
      on: NGN.EventEmitter.prototype.on,
      prependListener: NGN.EventEmitter.prototype.prependListener,
      once: NGN.EventEmitter.prototype.once,
      prependOnceListener: NGN.EventEmitter.prototype.prependOnceListener,
      off: NGN.EventEmitter.prototype.off,
      onceoff: NGN.EventEmitter.prototype.onceoff,
      getAllEvents: NGN.EventEmitter.prototype.getAllEvents
    }
  }
}

NGN.EventEmitter.prototype.emit = function () {
  NGN.SANITY.isValid('EE.emit', arguments) ? original.NGN.EventEmitter.emit.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.listenerCount = function () {
  return NGN.SANITY.isValid('EE.listenerCount', arguments) ? original.NGN.EventEmitter.listenerCount.apply(this, arguments) : 0
}

NGN.EventEmitter.prototype.on = function () {
  NGN.SANITY.isValid('EE.on', arguments) ? original.NGN.EventEmitter.on.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.prependListener = function () {
  NGN.SANITY.isValid('EE.prependListener', arguments) ? original.NGN.EventEmitter.prependListener.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.once = function () {
  NGN.SANITY.isValid('EE.once', arguments) ? original.NGN.EventEmitter.once.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.prependOnceListener = function () {
  NGN.SANITY.isValid('EE.prependOnceListener', arguments) ? original.NGN.EventEmitter.prependOnceListener.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.off = function () {
  NGN.SANITY.isValid('EE.off', arguments) ? original.NGN.EventEmitter.off.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.onceoff = function () {
  NGN.SANITY.isValid('EE.onceoff', arguments) ? original.NGN.EventEmitter.onceoff.apply(this, arguments) : null
}

NGN.EventEmitter.prototype.getAllEvents = function () {
  return NGN.SANITY.isValid('EE.getAllEvents', arguments) ? original.NGN.EventEmitter.getAllEvents.apply(this, arguments) : []
}
