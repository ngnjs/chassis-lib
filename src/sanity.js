/**
 * @layer SANITY
 * The sanity layer adds dummy checks around methods to make sure they are being called correctly throughout the application.
 * It is designed for development, and not meant to be included in production.
 */
let original = {
  NGN: {
    EventEmitter: {
      emit: NGN.EventEmitter.prototype.emit
    }
  }
}
NGN.EventEmitter.prototype.emit = function () {
  if (!arguments.length) {
    console.warn('NGN.BUS.emit called without required args')
    return
  }
  console.log(arguments)
  original.NGN.EventEmitter.emit.apply(this, arguments)
}
