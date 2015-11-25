'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.HttpProxy
 * Provides a gateway to a remote HTTP/S endpoint.
 * @extends NGN.DATA.Proxy
 */
if (NGN.DATA.Proxy && NGN.HTTP) {
  window.NGN.DATA.HttpProxy = function (cfg) {
    cfg = cfg || {}

    this.constructor(cfg)
    // NGN.DATA.Proxy.constructor(cfg)

    Object.defineProperties(this, {
      /**
       * @cfg {object} headers
       * Provide custom HTTP headers that will be applied to every request.
       */
      headers: NGN.define(true, true, false, cfg.headers || {}),

      save: NGN.define(true, false, false, function (path) {
        var url = this.url + (path || '')
        this.actions.create.forEach(function (model) {
          NGN.HTTP.post(url)
        })
      })
    })
  }
  window.NGN.DATA.HttpProxy.prototype = window.NGN.DATA.Proxy.prototype
} else {
  throw new Error('NGN.DATA.Proxy & NGN.HTTP are required for NGN.DATA.HttpProxy.')
}
