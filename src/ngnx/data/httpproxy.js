'use strict'

window.NGNX = window.NGNX || {}
window.NGNX.DATA = window.NGNX.DATA || {}

/**
 * @class NGNX.DATA.HttpProxy
 * Provides a gateway to a remote HTTP/S endpoint.
 * @extends NGN.DATA.Proxy
 */
if (NGN.DATA.Proxy && NGN.HTTP) {
  window.NGNX.DATA.HttpProxy = function (cfg) {
    cfg = cfg || {}

    this.constructor(cfg)
    var me = this

    Object.defineProperties(this, {
      /**
       * @cfg {object} headers
       * Provide custom HTTP headers that will be applied to every request.
       */
      headers: NGN.define(true, true, false, cfg.headers || {}),

      /**
       * @property options
       * The request option values.
       * @readonly
       * @private
       */
      options: NGN._get(function () {
        var req = {
          url: this.url,
          headers: this.headers
        }
        if (this.token) {
          req.accessToken = this.token
        }
        if (this.username) {
          req.username = this.username
        }
        if (this.password) {
          req.password = this.password
        }
        if (this.username && this.password) {
          req.withCredentials = true
        }
        return req
      }),

      /**
       * @method save
       * @param  {string} [path]
       * The path on which save operations should occur.
       * @param {function} [callback]
       * An optional callback to execute when the save is complete.
       * @fires save.error
       * Fired when a non-200/201 response code is received from the
       * remote server when trying to save data.
       */
      save: NGN.define(true, false, false, function (path, callback) {
        if (typeof url === 'function') {
          callback = path
          path = ''
        }

        var i = 0
        var increment = function (action, model) {
          return function (res) {
            i++
            if (!(res.status === 200 || res.status === 201)) {
              NGN.emit('save.error', {
                message: res.responseText,
                status: res.status,
                action: action,
                model: model
              })
            }
            if (i === (me.actions.create.length + me.actions.update.length + me.actions.delete.length)) {
              callback && callback()
            }
          }
        }

        var req = this.options
        req.url += (path || '')

        this.actions.create.forEach(function (model) {
          req.json = model.data
          NGN.HTTP.post(req, increment('create', model))
        })
        this.actions.update.forEach(function (model) {
          req.url += '/' + model.id
          req.json = model.data
          NGN.HTTP.put(req, increment('update', model))
        })
        this.actions.delete.forEach(function (model) {
          req.url += '/' + model.id
          NGN.HTTP.delete(req, increment('delete', model))
        })
      }),

      /**
       * @method fetch
       * Retrieve a JSON array-based data set from an API endpoint.
       * This method basically runs a `GET /path`, expecting an
       * array of data that can be loaded to the NGN.DATA.Model.
       * @param  {string} [path]
       * An optional path to add to the URL. This can Include
       * query strings.
       * @param {function} callback
       */
      fetch: NGN.define(true, false, false, function (path, callback) {
        var req = this.options
        req.url += (path || '')
        NGN.HTTP.get(req, function (res) {
          var data = res.responseText
          if (typeof data === 'string') {
            data = JSON.parse(data)
          }
          if (data instanceof Array) {
            me.store.reload(data)
          }
          callback && callback()
        })
      })
    })
  }
  NGN.DATA.util.inherit(NGN.DATA.Proxy, NGNX.DATA.HttpProxy)
} else {
  throw new Error('NGN.DATA.Proxy & NGN.HTTP are required for NGN.DATA.HttpProxy.')
}
