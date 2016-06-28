/**
 * @layer SANITY
 * The sanity layer adds dummy checks around methods to make sure they are being called correctly throughout the application.
 * It is designed for development, and not meant to be included in production.
 */
NGN.Sanity = {}

Object.defineProperties(NGN.Sanity, {
  /**
   * @method xhr
   * Issue an XHR request.
   * @private
   * @param  {Function} callback
   * The callback to execute when the request finishes (or times out.)
   */
  check: NGN.privateconst(function (type, args) {
    switch (type) {
      case 'emit':
      if (!args.length) {
        console.warn('emit() called without required args')
        return false
      }
    }
    return true
  })
})

let original = {
  NGN: {
    EventEmitter: {
      emit: NGN.EventEmitter.prototype.emit
    }
  }
}

NGN.EventEmitter.prototype.emit = function () {
  NGN.Sanity.check('emit', arguments) ? original.NGN.EventEmitter.emit.apply(this, arguments) : null
}
