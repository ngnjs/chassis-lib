/**
 * @class HTTP
 * A library to issue HTTP/S requests. This acts as an AJAX library.
 * @author Corey Butler
 * @singleton
 */
window.HTTP = {

  /**
   * @method xhr
   * Issue an XHR request.
   * @private
   * @param  {Function} callback
   * The callback to execute when the request finishes (or times out.)
   */
  xhr: function(callback){
    var res;

    if (window.XMLHttpRequest) {
      // code for IE7+, Firefox, Chrome, Opera, Safari
      res = new XMLHttpRequest();
    }

    res.onreadystatechange = function () {
      if (res.readyState == 4) {
        callback && callback(res);
      }
    }

    return res;
  },

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
  run: function (method, url, callback) {
    var res = HTTP.xhr(callback);
    res.open(method, url, true);
    res.send();
  },

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
   * provided, a `Content-Type: application/text;charset=UTF-8` header is automatically supplied.
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
  applyRequestSettings: function(xhr, cfg){
    if (!xhr || !cfg){
      throw new Error('No XHR or configuration object defined.');
    }

    // Add URL Parameters
    if (cfg.params){
      var parms = Object.keys(cfg.params).map(function(parm){
        return parm+'='+encodeURIComponent(cfg.params[parm]);
      });
      cfg.url += '?' + parms.join('&');
      console.log(cfg.url);
    }

    xhr.open(cfg.method || 'POST', cfg.url, true);

    // Set headers
    cfg.header = cfg.header || cfg.headers || {};
    Object.keys(cfg.header).forEach(function(header){
      xhr.setRequestHeader(header,cfg.header[header]);
    });

    // Handle body (Blank, plain text, or JSON)
    var body = null;
    if (cfg.json){
      if (!cfg.header || (cfg.header && !cfg.header['Content-Type'])){
        xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      }
      body = JSON.stringify(cfg.json).trim();
    } else if (cfg.body){
      if (!cfg.header || (cfg.header && !cfg.header['Content-Type'])){
        xhr.setRequestHeader("Content-Type", "application/text");
      }
      body = cfg.body;
    } else if (cfg.form) {
      var body = new FormData();
      Object.keys(cfg.form).forEach(function(el){
        body.append(el,cfg.form[el]);
      });
    }

    // Handle withCredentials
    if (cfg.withCredentials){
      xhr.withCredentials = cfg.withCredentials;
    }

    // Handle credentials sent with request
    // if (cfg.username){
    //   xhr.user = cfg.username;
    // }
    // if (cfg.password){
    //   xhr.password = cfg.password;
    // }
    if (cfg.username && cfg.password){
      // Basic Auth
      xhr.setRequestHeader("Authorization", "Basic "+btoa(cfg.username+':'+cfg.password));
    } else if (cfg.accessToken){
      // Bearer Auth
      xhr.setRequestHeader("Authorization", "Bearer "+cfg.accessToken);
    }

    return body;
  },

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
  send: function (cfg, callback) {
    cfg = cfg || {};
    var res = this.xhr(callback);
    var body = this.applyRequestSettings(res, cfg);
    res.send(body);
  },

  /**
   * @method prepend
   * A helper method to prepend arguments.
   * @private
   * @param  {[type]} args [description]
   * @param  {[type]} el   [description]
   * @return {[type]}      [description]
   */
  prepend: function (args, el) {
    var args = Array.prototype.slice.call(args);
    args.unshift(el);
    return args;
  },

  /**
   * @method get
   * Issue a `GET` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  get: function () {
    if (typeof arguments[0] === 'object'){
      var cfg = arguments[0];
      cfg.method = 'GET';
      cfg.url = typeof arguments[1] === 'string' ? arguments[1] : cfg.url;
      return this.send(cfg, arguments[arguments.length-1]);
    }
    this.run.apply(this.run, this.prepend(arguments, "GET"));
  },

  /**
   * @method put
   * Issue a `PUT` request.
   * @param  {object} cfg
   * See the options for @send#cfg
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  put: function (cfg,callback) {
    cfg = cfg || {};
    cfg.method = 'PUT';
    cfg.url = cfg.url || window.location;
    this.send(cfg,callback);
  },

  /**
   * @method post
   * Issue a `POST` request.
   * @param  {object} cfg
   * See the options for @send#cfg
   * @param  {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  post: function (cfg, callback) {
    cfg = cfg || {};
    cfg.method = 'POST';
    cfg.url = cfg.url || window.location;
    this.send(cfg, callback);
  },

  /**
   * @method delete
   * Issue a `DELETE` request.
   * @param {string} url
   * The URL to issue the request to.
   * @param {Function} callback
   * A callback method to run when the request is complete.
   * This receives the response object as the only argument.
   */
  delete: function() {
    this.run.apply(this.run, this.prepent(arguments, "DELETE"));
  },

  /**
   * @method json
   * This is a shortcut method for creating a `GET` request and
   * auto-processing the response body into a JSON object.
   * @param  {string} url
   * The URL to issue the request to.
   * @param  {Function} callback
   * This receives a JSON response object from the server as it's only argument.
   */
  json: function (cfg, url, callback) {
    if (typeof cfg === 'string'){
      callback = url;
      url = cfg;
      cfg = null;
    }
    if (cfg === null){
      this.run("GET", url, function (res) {
        if (res.status !== 200){
          throw Error("Could not retrieve JSON data from "+url+" (Status Code: "+res.status+").");
        }
        try {
          res.json = JSON.parse(res.responseText);
        } catch (e) {
          res.json = null;
        }
        callback && callback(res.json);
      });
    } else {
      cfg.url = url;
      this.get(cfg, function (res) {
        if (res.status !== 200){
          throw Error("Could not retrieve JSON data from "+url+" (Status Code: "+res.status+").");
        }
        try {
          res.json = JSON.parse(res.responseText);
        } catch (e) {
          res.json = null;
        }
        callback && callback(res.json);
      });
    }
  },

  /**
   * @method normalizeUrl
   * Cleanup a URL.
   * @private
   */
  normalizeUrl: function(url){
    var uri = [];

    url.split('/').forEach(function(el){
      if (el === '..') {
        uri.pop();
      } else if (el !== '.') {
        uri.push(el);
      }
    });

    return uri.join('/');
  },

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
  import: function(url, callback, bypassCache){

    // Support JS/CSS
    try {
      var ext = url.split('/').pop().split('?')[0].split('.').pop().toLowerCase();
      if (ext === 'js'){
        var s = document.createElement('script');
        s.setAttribute("type","text/javascript");
        s.setAttribute("src", url);
        document.getElementsByTagName("head")[0].appendChild(s);
        return;
      } else if (ext === 'css'){
        var css = document.createElement('link');
        s.setAttribute("rel","stylesheet");
        s.setAttribute("type","text/css");
        s.setAttribute("href", url);;
        document.getElementsByTagName("head")[0].appendChild(s);
        return;
      }
    } catch(e){}

    bypassCache = typeof bypassCache === 'boolean' ? bypassCache : false;

    // If a local reference is provided, complete the path.
    if (url.substr(0,4) !== 'http'){
      var path = window.location.href.split('/');
      path.pop();
      url = path.join('/')+'/'+url;
    }

    // Use the cache if defined & not bypassed
    if (!bypassCache && this.importCache.hasOwnProperty(url)){
      var div = document.createElement('tbody');
      div.innerHTML = this.importCache[url];
      callback && callback(div.children.length===1?div.children[0]:div.children);
      if (window.BUS){
        window.BUS.emit('html.import',div.children.length===1?div.children[0]:div.children);
      }
      delete div;
      // console.warn('Used cached version of '+url);
      return;
    }

    // Retrieve the file content
    var me = this;
    this.get(url,function(res){
      if (res.status !== 200){
        return console.warn('Check the file path of the snippet that needs to be imported. '+url+' could not be found ('+res.status+')');
      }
      var div = document.createElement('tbody');
      me.importCache[url] = res.responseText;
      div.innerHTML = res.responseText;
      if (div.children.length === 0){
        console.warn(me.normalizeUrl(url)+ ' import has no HTML tags.');
        callback && callback(res.responseText);
        if (window.BUS){
          window.BUS.emit('html.import',res.responseText);
        }
      } else {
        callback && callback(div.children.length===1?div.children[0]:div.children);
        if (window.BUS){
          window.BUS.emit('html.import',div.children.length===1?div.children[0]:div.children);
        }
      }
      delete div;
    });
  },

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
  importTo: function(url, target, callback){
    this.import(url, function(element){
      if (typeof element === 'string'){
        element = document.createTextNode(element);
      } else if (element.length){
        var out = [];
        Array.prototype.slice.call(element).forEach(function(el){
          out.push(target.appendChild(el));
        });
        callback && callback(out);
        return;
      }
      target.appendChild(element);
      callback && callback(element);
    });
  },

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
  importBefore: function(url, target, callback){
    this.import(url, function(element){
      if (typeof element === 'string'){
        element = document.createTextNode(element);
      } else if (element.length){
        var out = [];
        Array.prototype.slice.call(element).forEach(function(el){
          out.push(target.parentNode.insertBefore(el, target));
          target = el;
        });
        callback && callback(out);
        return;
      }
      target.parentNode.insertBefore(element, target);
      callback && callback(element);
    });
  },

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
  template: function (url, data, callback) {

    url = this.normalizeUrl(url);

    if (typeof data === 'function'){
      callback = data;
      data = {};
    }

    data = data || {};

    var me = this, tpl;

    // Check the cache
    if (this.importCache.hasOwnProperty(url)){
      tpl = this.importCache[url];
      return this.applyData(tpl, data, callback);
    }

    this.import(url, function (element) {

      // support texxt nodes and HTML elements
      if (typeof element === 'string'){
        tpl = element;
      } else {
        tpl = element.outerHTML;
      }

      me.applyData(tpl,data,callback);
    });
  }

};

Object.defineProperties(window.HTTP,{
  importCache: {
    enumerable: false,
    writable: true,
    configurable: false,
    value: {}
  },
  applyData: {
    enumerable: false,
    writable: false,
    configurable: false,
    value: function (tpl, data, callback) {

      // Apply data to the template.
      Object.keys(data).forEach(function (key) {
        var re = new RegExp('\{\{'+key+'\}\}','gm');
        tpl = tpl.replace(re,data[key]);
      });

      // Clear any unused template code
      tpl = tpl.replace(/(\{\{.*\}\})/gm,'');

      var el = document.createElement('tbody');
      el.innerHTML = tpl;
      el = el.childNodes[0];

      callback && callback(el);

      delete el;
    }
  }
});
