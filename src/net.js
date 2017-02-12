/**
 * @class NGN.NET
 * A library to issue network requests, typically viaHTTP/S requests.
 * This acts as an AJAX library among other things.
 * @fires NETWORKERROR
 * Triggered if a network error occurs. Fired on the NGN.BUS.
 * @author Corey Butler
 * @singleton
 */
const parser = new DOMParser()
let fs = NGN.nodelike ? require('fs') : null

class Network extends NGN.EventEmitter {
  constructor () {
    super()

    Object.defineProperties(this, {
      /**
       * @property {object} globalHeaders
       * Contains headers that are applied to all requests.
       * @private
       */
      globalHeaders: NGN.private({}),

      /**
       * @property {object} globalCredentials
       * Contains credentials that are applied to all requests.
       * @private
       */
      globalCredentials: NGN.private({}),

      /**
       * @method xhr
       * Issue an XHR request.
       * @private
       * @param  {Function} callback
       * The callback to execute when the request finishes (or times out.)
       */
      xhr: NGN.privateconst(function (callback) {
        let res = new XMLHttpRequest()
        let responded = false

        res.onreadystatechange = function () {
          if (responded) {
            return
          }

          if (res.readyState === 4) {
            responded = true

            if (NGN.isFn(callback)) {
              callback(res)
            } else {
              return res
            }
          }
        }

        res.onerror = function (e) {
          NGN.BUS && NGN.BUS.emit('NETWORKERROR', e)

          if (!responded && NGN.isFn(callback)) {
            callback(res)
          }

          responded = true
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
      run: NGN.privateconst(function (method, url, callback) {
        let res = NGN.NET.xhr(callback)
        res.open(method, url, true)
        res.send()
      }),

      /**
       * @method runSync
       * A wrapper to execute a request synchronously.
       * @private
       * @param  {string} method required
       * The method to issue, such as GET, POST, PUT, DELETE, OPTIONS, etc.
       * @param  {string} url
       * The URL where the request is issued to.
       * @param  {Function} callback
       * A function to call upon completion.
       */
      runSync: NGN.privateconst(function (method, url) {
        let res = NGN.NET.xhr()
        res.open(method, url, false)
        res.send()
        return res
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
       * header will be applied (this can be overwritten using @cfg.headers).
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
      applyRequestSettings: NGN.privateconst(function (xhr, cfg) {
        if (!xhr || !cfg) {
          throw new Error('No XHR or configuration object defined.')
        }

        // Add URL Parameters
        if (cfg.params) {
          let parms = Object.keys(cfg.params).map(function (parm) {
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

        // Apply Global Headers
        Object.keys(this.globalHeaders).forEach((header) => {
          xhr.setRequestHeader(header, this.globalHeaders[header])
        })

        // Handle body (Blank, plain text, or JSON)
        let body = null
        if (cfg.json) {
          if (!cfg.header || (cfg.header && !cfg.header['Content-Type'])) {
            xhr.setRequestHeader('Content-Type', 'application/json')
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

        // Use Global Credentials (if applicable)
        if (this.globalCredentials.hasOwnProperty('accessToken') || (this.globalCredentials.hasOwnProperty('username') && this.globalCredentials.hasOwnProperty('password'))) {
          cfg.withCredentials = NGN.coalesce(cfg.withCredentials, true)
          if (this.globalCredentials.accessToken) {
            cfg.accessToken = NGN.coalesce(cfg.accessToken, this.globalCredentials.accessToken)
          } else {
            cfg.username = NGN.coalesce(cfg.username, this.globalCredentials.username)
            cfg.password = NGN.coalesce(cfg.password, this.globalCredentials.password)
          }
        }

        // Handle withCredentials
        if (cfg.withCredentials) {
          xhr.withCredentials = cfg.withCredentials
        }

        // Handle credentials sent with request
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
       * @method prepend
       * A helper method to prepend arguments.
       * @private
       * @param  {[type]} args [description]
       * @param  {[type]} el   [description]
       * @return {[type]}      [description]
       */
      prepend: NGN.privateconst(function (args, el) {
        args = NGN.slice(args)
        args.unshift(el)
        return args
      }),

      /**
       * @method getFile
       * A "get" method specifically for node-like environments.
       * @param {string} url
       * The URL to issue the request to.
       * @param {Function} callback
       * A callback method to run when the request is complete.
       * This receives the response object as the only argument.
       * @private
       */
      getFile: NGN.privateconst(function (url) {
        if (fs !== null) {
          let rsp = {
            status: fs.existsSync(url.replace('file://', '')) ? 200 : 400
          }
          rsp.responseText = rsp.status === 200 ? fs.readFileSync(url.replace('file://', '')).toString() : 'File could not be found.'
          return rsp
        } else {
          throw new Error(url + ' does not exist or could not be found.')
        }
      }),

      /**
       * @method normalizeUrl
       * Cleanup a URL.
       * @private
       */
      normalizeUrl: NGN.privateconst(function (url) {
        let uri = []

        url.split('/').forEach(function (el) {
          if (el === '..') {
            uri.pop()
          } else if (el !== '.') {
            uri.push(el)
          }
        })

        return uri.join('/').replace(/\:\/{3,50}/gi, '://')
      }),

      /**
       * @method domainRoot
       * Returns the root (no http/s) of the URL.
       * @param {string} url
       * The URL to get the root of.
       * @private
       */
      domainRoot: NGN.privateconst(function (url) {
        let r = (url.search(/^https?\:\/\//) !== -1 ? url.match(/^https?\:\/\/([^\/?#]+)(?:[\/?#]|$)/i, '') : url.match(/^([^\/?#]+)(?:[\/?#]|$)/i, ''))
        return r === null || r[1].length < 3 ? window.location.host : r[1]
      }),

      /**
       * @method isCrossOrigin
       * Determine if accessing a URL is considered a cross origin request.
       * @param {string} url
       * The URL to identify as a COR.
       * @returns {boolean}
       * @private
       */
      isCrossOrigin: NGN.privateconst(function (url) {
        return this.domainRoot(url) !== window.location.host
      }),

      /**
       * @method prelink
       * A helper method to construct pre-fetch style DOM elements.
       * This also fires an event when the element is added to the DOM.
       * @param {string} url
       * The URL of the operation.
       * @param {string} rel
       * The type of operation. For example: `preconnect`.
       * @param {boolean} [crossorigin]
       * Set to `true` to identify the request as a cross origin request.
       * By default, NGN will compare the URL to the current URL in an
       * attempt to determine if the request is across origins.
       * @private
       */
      prelink: NGN.privateconst(function (url, rel, cor) {
        if (!document.head) {
          console.warn('Cannot use a preconnect, predns, etc because there is no HEAD in the HTML document.')
          return
        }

        let p = document.createElement('link')
        p.rel = rel
        p.href = url.trim().toLowerCase().substr(0, 4) !== 'http' ? this.normalizeUrl(window.location.origin + window.location.pathname + url) : url

        NGN.coalesce(cor, this.isCrossOrigin(url)) && (p.setAttribute('crossorigin', 'true'))
        document.head.appendChild(p)
        NGN.BUS.emit('network.' + rel)
      }),

      importCache: NGN.private({}),

      createElement: NGN.privateconst(function (str) {
        return parser.parseFromString(str, 'text/html').querySelector('body').children
      }),

      applyData: NGN.privateconst(function (tpl, data, callback) {
        if (tpl === undefined) {
          console.warn('Empty template.')

          if (NGN.isFn(callback)) {
            callback()
          }

          return
        }

        // Apply data to the template.
        Object.keys(data).forEach(function (key) {
          let re = new RegExp('\{\{' + key + '\}\}', 'gm')
          tpl = tpl.replace(re, data[key])
        })

        // Clear any unused template code
        tpl = tpl.replace(/(\{\{.*\}\})/gm, '')

        // let el = this.createElement(tpl)
        if (NGN.isFn(callback)) {
          callback(tpl)
        }
      })
    })
  }

  /**
   * @property {object} headers
   * Retrieves the current global headers that were created with
   * the #setHeaders method.
   * @readonly
   */
  get headers () {
    return this.globalHeaders
  }

  /**
   * @method setHeaders
   * Configure a set of headers that are applied to every request.
   * This is commonly used when a remote resource requires a specific
   * header on every call.
   *
   * **Example**
   *
   * ```js
   * NGN.NET.setHeaders({
   *   'user-agent': 'my custom agent name'
   * })
   * ```
   */
  setHeaders (headers) {
    this.globalHeaders = headers
  }

  /**
   * @method setCredentials
   * Configure credentials that are applied to every request.
   * This is commonly used when communicating with a RESTful API.
   * This can accept a username and password or an access token.
   *
   * **Examples**
   *
   * ```js
   * NGN.NET.setCredentials({
   *  username: 'user',
   *  password: 'pass'
   * })
   * ```
   *
   * ```js
   * NGN.NET.setCredentials({
   *  accessToken: 'token'
   * })
   * ```
   */
  setCredentials (credentials) {
    if (credentials.hasOwnProperty('accesstoken') || credentials.hasOwnProperty('token')) {
      credentials.accessToken = NGN.coalesce(credentials.accesstoken, credentials.token)
    } else if (!(credentials.hasOwnProperty('username') && credentials.hasOwnProperty('password')) && !credentials.hasOwnProperty('accessToken')) {
      throw new Error('Invalid credentials. Must contain an access token OR the combination of a username AND password.')
    }

    this.globalCredentials = credentials
  }

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
  send (cfg, callback) {
    cfg = cfg || {}
    let res = this.xhr(NGN.coalesce(callback))
    let body = this.applyRequestSettings(res, cfg)

    res.send(body)
    return res
  }

  /**
   * @method prepareSubmissionConfiguration
   * Prepare common configuration attributes for a request.
   * @private
   */
  prepareSubmissionConfiguration (cfg, method) {
    if (typeof cfg === 'string') {
      cfg = {
        url: cfg
      }
    }

    cfg = cfg || {}
    cfg.method = method.toUpperCase()
    cfg.url = cfg.url || window.location
    return cfg
  }

  /**
   * @method retrieve
   * Executes HTTP requests that pull data (GET, HEAD)
   * with the option to run synchronously.
   * @param {string} method
   * The method (GET/HEAD) to use.
   * @param {boolean} [sync=false]
   * Set to `true` to run the request synchronously.
   * @private
   */
  retrieve (method, sync = false) {
    const me = this

    return function () {
      if (typeof arguments[0] === 'object') {
        let cfg = arguments[0]

        cfg.method = method
        cfg.url = typeof arguments[1] === 'string' ? arguments[1] : cfg.url

        // Support Node file reading.
        if (NGN.nodelike && cfg.url.substr(0, 7).toLowerCase() === 'file://') {
          return arguments[arguments.length - 1](this.getFile(cfg.url))
        }

        return this.send(cfg, arguments[arguments.length - 1])
      }

      // If the request is for a local file from a node-like environment,
      // read the file from disk.
      if (NGN.nodelike && typeof arguments[0] === 'string' && arguments[0].substr(0, 4) === 'file') {
        return arguments[arguments.length - 1](this.getFile(arguments[0]))
      }

      // Run synchronously (if specified)
      return me[sync ? 'runSync' : 'run'].apply(me[sync ? 'runSync' : 'run'], me.prepend(arguments, method))
    }
  }

  /**
   * @method get
   * Issue a `GET` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  get () {
    this.retrieve('GET').apply(this, arguments)
  }

  /**
   * @method getSync
   * Same as #get, but executed synchronously.
   * @param {string} url
   * The URL to issue the request to.
   * @returns {object} response
   * Returns a standard Response object.
   */
  getSync () {
    return this.retrieve('GET', true).apply(this, arguments)
  }

  /**
   * @method head
   * Issue a `HEAD` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  head (uri, callback) {
    this.retrieve('HEAD').apply(this, arguments)
  }

  /**
   * @method headSync
   * Same as #head, but executed synchronously.
   * @param {string} url
   * The URL to issue the request to.
   * @returns {object} response
   * Returns a standard Response object.
   */
  headSync (uri) {
    return this.retrieve('HEAD', true).apply(this, arguments)
  }

  /**
   * @method put
   * Issue a `PUT` request.
   * @param  {object|string} cfg
   * See the options for @send#cfg. If this is a string, it
   * must be a URL.
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  put (cfg, callback) {
    this.send(this.prepareSubmissionConfiguration(cfg, 'PUT'), callback)
  }

  /**
   * @method putSync
   * Same as #put, but executed synchronously.
   * @param  {object|string} cfg
   * See the options for @send#cfg. If this is a string, it
   * must be a URL.
   * @returns {object} response
   * Returns a standard Response object.
   */
  putSync (cfg) {
    return this.send(this.prepareSubmissionConfiguration(cfg, 'PUT'))
  }

  /**
   * @method post
   * Issue a `POST` request.
   * @param  {object|string} cfg
   * See the options for @send#cfg. If this is a string, it
   * must be a URL.
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  post (cfg, callback) {
    this.send(this.prepareSubmissionConfiguration(cfg, 'PUT'), callback)
  }

  /**
   * @method postSync
   * Same as #post, but executed synchronously.
   * @param  {object|string} cfg
   * See the options for @send#cfg. If this is a string, it
   * must be a URL.
   * @returns {object} response
   * Returns a standard Response object.
   */
  postSync (cfg) {
    return this.send(this.prepareSubmissionConfiguration(cfg, 'POST'))
  }

  /**
   * @method delete
   * Issue a `DELETE` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  delete () {
    this.run.apply(this.run, this.prepend(arguments, 'DELETE'))
  }

  /**
   * @method deleteSync
   * Same as #delete, but executed synchronously.
   * @param {string} url
   * The URL to issue the request to.
   * @returns {object} response
   * Returns a standard Response object.
   */
  deleteSync () {
    return this.runSync.apply(this.runSync, this.prepend(arguments, 'DELETE'))
  }

  /**
   * @method runJsonRequest
   * A method for running a GET request and parsing the response as JSON.
   * If no callback is specified, the request is assumed to be synchronous.
   * @param  {string} url
   * The URL to issue the request to.
   * @param  {Function} callback
   * This receives a JSON response object from the server as its only argument.
   * @private
   */
  runJsonRequest (cfg, url, callback) {
    if (typeof cfg === 'string') {
      callback = url
      url = cfg
      cfg = null
    }

    cfg = cfg || {
      url: url
    }

    // If no callback is specified, assume it's a synchronous request.
    if (!NGN.isFn(callback)) {
      let res = this.getSync(cfg)

      try {
        res.json = JSON.parse(res.responseText)
      } catch (e) {
        res.json = null
      }

      return res.json
    }

    // Assume asynchronous request
    this.get(cfg, function (res) {
      try {
        res.json = JSON.parse(res.responseText)
      } catch (e) {
        res.json = null
      }

      callback(res.json)
    })
  }

  /**
   * @method json
   * This is a shortcut method for creating a `GET` request and
   * auto-processing the response body into a JSON object.
   * @param  {string} url
   * The URL to issue the request to.
   * @param  {Function} callback
   * This receives a JSON response object from the server as its only argument.
   */
  json (cfg, url, callback) {
    this.runJsonRequest(cfg, url, callback)
  }

  /**
   * @method jsonSync
   * Same as #json, but executed synchronously.
   * @param  {string} url
   * The URL to issue the request to.
   * @returns {object} response
   * Returns a standard Response object.
   */
  jsonSync (cfg, url) {
    return this.runJsonRequest(cfg, url)
  }

  /**
   * @method jsonp
   * Execute a request via JSONP.
   * @param {string} url
   * The URL of the JSONP endpoint.
   * @param {function} callback
   * Handles the response.
   * @param {object|array} callback.response
   * The response.
   */
  jsonp (url, callback) {
    const fn = 'jsonp_callback_' + Math.round(100000 * Math.random())

    window[fn] = (data) => {
      delete window[fn]
      document.body.removeChild(script)
      callback(data)
    }

    let script = document.createElement('script')
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + fn

    document.body.appendChild(script)
  }

  /**
   * @method import
   * Import a remote HTML fragment.
   * @param {string|array} url
   * The URL of remote HTML snippet. If the URL has a `.js` or `.css`
   * extension, it will automatically be added to the `<head>`.
   * It is also possible to provide an array of string values. Take
   * note that the callback may return a different value based on
   * this input.
   * @param {string|array} callback
   * If a **string** is provided as the URL, this returns the HTMLElement,
   * which can be directly inserted into the DOM. If an **array** is
   * provided as the URL, the callback will return an array of HTMLElements.
   * For example:
   *
   * ```js
   * NGN.NET.import([
   *   '/path/a.html',
   *   '/path/b.html',
   *   '/path/a.js'
   *   ], function (elements){
   *     console.dir(elements)
   *   }
   * })
   *```
   * The result `elements` array would look like:
   *
   * ```js
   * [
   *   HTMLElement, // DOM element created for a.html
   *   HTMLElement, // DOM element created for b.html
   *   HTMLElement  // DOM element created for a.js (this will be in the <head>)
   * ]
   * ```
   * The last array element is `null`
   * @param {boolean} [bypassCache=false]
   * When set to `true`, bypass the cache.
   * @fires html.import
   * Returns the HTMLElement/NodeList as an argument to the event handler.
   */
  'import' (url, callback, bypassCache) {
    // Support multiple simultaneous imports
    if (Array.isArray(url)) {
      let out = new Array(url.length)
      let i = 0

      url.forEach((uri, num) => {
        this.import(uri, function (el) {
          out[num] = el
          i++
        }, bypassCache)
      })

      if (callback) {
        let int = setInterval(function () {
          if (i === url.length) {
            clearInterval(int)
            callback(out)
          }
        }, 5)
      }

      return
    }

    // Support JS/CSS
    let ext = this.getFileExtension(url)
    try {
      let s
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

      s.onload = typeof callback === 'function' ? function () { callback(s) } : function () {}

      document.getElementsByTagName('head')[0].appendChild(s)
    } catch (e) {}

    if (['js', 'css'].indexOf((ext || '').trim().toLowerCase()) >= 0) {
      return
    }

    bypassCache = typeof bypassCache === 'boolean' ? bypassCache : false

    // If a local reference is provided, complete the path.
    if (url.substr(0, 4) !== 'http') {
      let path = window.location.href.split('/')
      path.pop()
      url = path.join('/') + '/' + url
    }

    // Use the cache if defined & not bypassed
    if (!bypassCache && this.importCache.hasOwnProperty(url)) {
      if (callback) {
        callback(this.importCache[url])
      }

      if (NGN.BUS) {
        NGN.BUS.emit('html.import', this.importCache[url])
      }

      // console.warn('Used cached version of '+url)
      return
    }

    // Retrieve the file content
    // If the fetch method is available, use it. Fallback
    // to a standard GET operation.
    if (Request !== undefined && Response !== undefined && Headers !== undefined && window.hasOwnProperty('fetch') && typeof fetch === 'function') {
      let remoteFile = new Request(url)
      let headers = new Headers()
      let creds = /^.*\:\/\/(.*)\:(.*)\@(.*)$/gi.exec(url)
      let cfg = {
        redirect: 'follow'
      }

      if (creds !== null) {
        headers.append('Authorization', 'Basic ' + btoa(creds[2] + ':' + creds[3]))
        url = creds[1] + '://' + creds[4]
        cfg.credentials = 'include'
      } else {
        // Add credentials if necessary
        if (this.globalCredentials.hasOwnProperty('accessToken') || (this.globalCredentials.hasOwnProperty('username') && this.globalCredentials.hasOwnProperty('password'))) {
          if (this.globalCredentials.accessToken) {
            headers.append('Authorization', 'Token ' + this.globalCredentials.accessToken)
          } else {
            headers.append('Authorization', 'Basic ' + btoa(this.globalCredentials.username + ':' + this.globalCredentials.password))
          }

          cfg.credentials = 'include'
        }
      }

      // Add any global headers
      Object.keys(this.globalHeaders).forEach((hdr) => {
        headers.append(hdr, this.globalHeaders[hdr])
      })

      cfg.headers = headers

      fetch(remoteFile, cfg).then((res) => {
        return res.text()
      }).then((content) => {
        if (typeof callback === 'function') {
          callback(content)
        }

        if (NGN.BUS) {
          NGN.BUS.emit('html.import', content)
        }
      }).catch((err) => {
        throw err
      })
    } else {
      this.get(url, (res) => {
        if (res.status !== 200) {
          return console.warn('Check the file path of the snippet that needs to be imported. ' + url + ' could not be found (' + res.status + ')')
        }

        let doc = res.responseText
        this.importCache[url] = doc

        if (doc.length === 0) {
          console.warn(this.normalizeUrl(url) + ' import has no content!')
        }

        if (NGN.isFn(callback)) {
          callback(doc)
        }

        if (NGN.BUS) {
          NGN.BUS.emit('html.import', doc)
        }
      })
    }
  }

  /**
   * @method fetchImport
   * A generic method to fetch code, insert to the DOM,
   * and execute a callback once the operation is complete.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {function} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   * @private
   */
  fetchRemoteFile (url, target, position, callback) {
    this.import(url, function (content) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            clearTimeout(timeout)
            observer.disconnect()

            if (NGN.isFn(callback)) {
              callback(mutation.addedNodes[0])
            }
          }
        })
      })

      observer.observe(target, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: false
      })

      let timeout = setTimeout(() => {
        if (NGN.isFn(callback)) {
          callback(content)
        }
      }, 750)

      target.insertAdjacentHTML(position, content)
    })
  }

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
   * @param {function} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importTo (url, target, callback) {
    this.fetchRemoteFile(url, target, 'beforeend', callback)
  }

  /**
   * @method importAfter
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the DOM after the target element. This is
   * the equivalent of using results of the #import to retrieve a snippet,
   * then doing a `target.insertAdjacentHTML('afterend', importedElement)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement/NodeList, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importAfter (url, target, callback) {
    this.fetchRemoteFile(url, target, 'afterend', callback)
  }

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
  importBefore (url, target, callback) {
    this.fetchRemoteFile(url, target, 'beforebegin', callback)
  }

  /**
   * @method template
   * Include a simple letiable replacement template and apply
   * values to it. This is always cached client side.
   * @param {string} url
   * URL of the template to retrieve.
   * @param {object} [letiables]
   * A key/value objct containing letiables to replace in
   * the template.
   * @param {function} callback
   * The callback receives a single argument with the HTMLElement/
   * NodeList generated by the template.
   */
  template (url, data, callback) {
    url = this.normalizeUrl(url)

    if (typeof data === 'function') {
      callback = data
      data = {}
    }

    data = data || {}

    let tpl

    // Check the cache
    if (this.importCache.hasOwnProperty(url)) {
      tpl = this.importCache[url]
      return this.applyData(tpl, data, callback)
    }

    this.get(url, (res) => {
      let ext = this.getFileExtension(url)

      if (['js', 'css'].indexOf((ext || '').trim().toLowerCase()) >= 0) {
        console.warn('Cannot use a .' + ext + ' file as a template. Only HTML templates are supported.')
        return
      }

      this.importCache[url] = res.responseText
      this.applyData(res.responseText, data, callback)
    })
  }

  /**
   * @method predns
   * This notifies the browser domains which will be accessed at a later
   * time. This helps the browser resolve DNS inquiries quickly.
   * @param {string} domain
   * The domain to resolve.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network-dns-prefetch
   * Fired when a pre-fetched DNS request is issued to the browser.
   */
  predns (domain, cor) {
    this.prelink(window.location.protocol + '//' + domain, 'dns-prefetch', cor)
  }

  /**
   * @method preconnect
   * Tell the browser which remote resources will or may be used in the
   * future by issuing a `Preconnect`. This will resolve DNS (#predns), make the TCP
   * handshake, and negotiate TLS (if necessary). This can be done directly
   * in HTML without JS, but this method allows you to easily preconnect
   * a resource in response to a user interaction or NGN.BUS activity.
   * @param {string} url
   * The URL to preconnect to.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.preconnect
   * Fired when a preconnect is issued to the browser.
   */
  preconnect (url, cor) {
    this.prelink(url, 'preconnect', cor)
  }

  /**
   * @method prefetch
   * Fetch a specific resource and cache it.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  prefetch (url, cor) {
    this.prelink(url, 'prefetch', cor)
  }

  /**
   * @method subresource
   * A prioritized version of #prefetch. This should be used
   * if the asset is required for the current page. Think of this
   * as "needed ASAP". Otherwise, use #prefetch.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  subresource (url, cor) {
    this.prelink(url, 'subresource', cor)
  }

  /**
   * @method prerender
   * Prerender an entire page. This behaves as though a page is
   * opened in a hidden tab, then displayed when called. This is
   * powerful, but should only be used when there is absolute
   * certainty that the prerendered page will be needed. Otherwise
   * all of the assets are loaded for no reason (i.e. uselessly
   * consuming bandwidth).
   * @param {string} url
   * URL of the page to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prerender
   * Fired when a prerender is issued to the browser.
   */
  prerender (url, cor) {
    this.prelink(url, 'prerender', cor)
  }

  /**
   * @method getFileExtension
   * Returns the extension of the file specified within a URI.
   * @param {string} uri
   * The URI of the resource.
   * @returns {string}
   * The extension.
   * @private
   */
  getFileExtension (uri) {
    let ext = null

    try {
      ext = uri.split('/').pop().split('?')[0].split('.').pop().toLowerCase()
    } catch (e) {}

    return ext
  }
}

NGN.extend('NET', NGN.const(new Network()))
