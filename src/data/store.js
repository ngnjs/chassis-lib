window.NGN.DATA = {}

/**
 * @class DATA.Store
 * Represents a collection of data.
 */
window.NGN.DATA.Store = function (cfg) {
  cfg = cfg || {}

  Object.defineProperties(this, {
    model: NGN.define(true, false, false, '')
  })
}
