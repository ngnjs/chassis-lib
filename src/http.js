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
      s.onload = callback || function () {}
      document.getElementsByTagName('head')[0].appendChild(s)
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
   * @method isCrossOrigin
   * Determine if accessing a URL is considered a cross origin request.
   * @param {string} url
   * The URL to identify as a COR.
   * @returns {boolean}
   */
  isCrossOrigin: NGN.define(false, false, false, function (url) {
    var uri = /^https?(\:\/\/)([^\/:?#]+)$/.exec(this.normalizeUrl(url))
    if (!uri) return true
    return window.location.indexOf(uri[0]) !== 0
  }),

  prelink: NGN.define(false, false, false, function (url, rel) {
    var p = document.createElement('link')
    p.rel = rel
    p.href = url
    this.isCrossOrigin(url) && (p.setAttribute('crossorigin', 'true'))
    document.head.appendChild(p)
    NGN.emit('network.' + rel)
  }),

  /**
   * @method predns
   * This notifies the browser domains which will be accessed at a later
   * time. This helps the browser resolve DNS inquiries quickly.
   * @param {string} domain
   * The domain to resolve.
   * @fires network-dns-prefetch
   * Fired when a pre-fetched DNS request is issued to the browser.
   */
  predns: NGN.define(true, false, false, function (domain) {
    this.prelink(window.location.protocol + '//' + domain, 'dns-prefetch')
  }),

  /**
   * @method preconnect
   * Tell the browser which remote resources will or may be used in the
   * future by issuing a `Preconnect`. This will resolve DNS (#predns), make the TCP
   * handshake, and negotiate TLS (if necessary). This can be done directly
   * in HTML without JS, but this method allows you to easily preconnect
   * a resource in response to a user interaction or NGN.BUS activity.
   * @param {string} url
   * The URL to preconnect to.
   * @fires network.preconnect
   * Fired when a preconnect is issued to the browser.
   */
  preconnect: NGN.define(true, false, false, function (url) {
    this.prelink(url, 'preconnect')
  }),

  /**
   * @method prefetch
   * Fetch a specific resource and cache it.
   * @param {string} url
   * URL of the resource to download and cache.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  prefetch: NGN.define(true, false, false, function (url) {
    this.prelink(url, 'prefetch')
  }),

  /**
   * @method subresource
   * A prioritized version of #prefetch. This should be used
   * if the asset is required for the current page. Think of this
   * as "needed ASAP". Otherwise, use #prefetch.
   * @param {string} url
   * URL of the resource to download and cache.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  subresource: NGN.define(true, false, false, function (url) {
    this.prelink(url, 'subresource')
  }),

  /**
   * @method prerender
   * Prerender an entire page. This behaves as though a page is
   * opened in a hidden tab, then displayed when called. This is
   * powerful, but should only be used when there is absolutely
   * certainty that the prerendered page will be needed. Otherwise
   * all of the assets are loaded for no reason (i.e. uselessly
   * consuming bandwidth).
   * @param {string} url
   * URL of the page to download and cache.
   * @fires network.prerender
   * Fired when a prerender is issued to the browser.
   */
  prerender: NGN.define(true, false, false, function (url) {
    this.prelink(url, 'prerender')
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
