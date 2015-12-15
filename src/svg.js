/**
 * @class NGN.DOM.svg
 * Provides a way to easily manage SVG images within a document while
 * retaining the ability to style them with external CSS.
 * @singleton
 */
/* This file should be loaded in the <head>, not at the end of the <body>.
* By loading this script before the rest of the DOM, it will insert the
* FOUC (Flash of Unstyled Content) CSS into the page BEFORE unstyled SVG images
* are loaded. If this script is included in the <body>, the CSS will be loaded
* AFTER the SVG images are loaded, meaning they may display briefly before
* proper styling can be applied to the DOM.
*/

// Prevent FOUC
var __preventfouc = function () {
  var ss = document.createElement('style')
  var str = document.createTextNode('svg[src]{display:none}svg.loading{height:0px !important;width:0px !important}')
  ss.appendChild(str)
  document.head.appendChild(ss)
}
__preventfouc()

// Add support for node-ish environments (Electron, NW.js, etc)
var _nodeish_env = false
try {
  _nodeish_env = require !== undefined
} catch (e) {}

// SVG Controller
window.NGN = window.NGN || {}
window.NGN.DOM = window.NGN.DOM || {}
window.NGN.DOM.svg = {}

Object.defineProperties(window.NGN.DOM.svg, {
  /**
   * @property {Object} _cache
   * A cache of SVG images.
   */
  _cache: NGN.define(false, false, true, {}),

  /**
   * @method swap
   * Replace image tags with the SVG equivalent.
   * @param {HTMLElement|NodeList} imgs
   * The HTML element or node list containing the images that should be swapped out for SVG files.
   * @param {function} [callback]
   * Executed when the image swap is complete. There are no arguments passed to the callback.
   * @private
   */
  swap: NGN.define(false, false, false, function (svgs, callback) {
    var me = this
    for (var i = 0; i < svgs.length; i++) {
      var attr = svgs[i].attributes
      var output = me._cache[svgs[i].getAttribute('src')]
      var attrs = []
      try {
        attrs = /<svg(\s.*=[\"\'].*?[\"\'])?>/i.exec(output)[1].trim()
        var sep = /[\"\']\s/i.exec(attrs)[0]
        attrs = attrs.replace(new RegExp(sep, 'gi'), sep.replace(/\s/ig, ',')).split(',')
      } catch (e) {}
      var map = attrs.map(function (els) {
        return els.split('=')[0].trim().toLowerCase()
      })
      for (var x = 0; x < attr.length; x++) {
        var idx = map.indexOf(attr[x].name.toLowerCase())
        if (idx < 0) {
          attrs.push(attr[x].name + '="' + attr[x].value + '"')
        } else {
          attrs[idx] = attr[x].name + '="' + attr[x].value + '"'
        }
      }
      attrs = attrs.filter(function (a) {
        return a.split('=')[0].toLowerCase() !== 'src'
      })
      var svg = '<svg ' + attrs.join(' ') + '>'
      svgs[i].outerHTML = output.replace(/<svg.*?>/i, svg)
    }
    callback && callback()
  }),

  /**
   * @method id
   * @param  {string} url
   * Create an ID that can be used to reference an SVG symbol.
   * @return {string}
   * @private
   */
  id: NGN.define(false, false, false, function (url) {
    return url.replace(/.*\:\/\/|[^A-Za-z0-9]|www/gi, '')
  }),

  /**
   * @method cleanCode
   * Captures all of the content between the <svg></svg> tag.
   * @param  {string} code
   * The code to clean up.
   * @return {string}
   * @private
   */
  cleanCode: NGN.define(false, false, false, function (code) {
    try {
      return code.toString().trim().replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ').match(/\<svg.*\<\/svg\>/igm, '')[0]
    } catch (e) {
      return ''
    }
  }),

  /**
   * @method viewbox
   * Retrieves the viewbox attribute from the source code.
   * @param  {string} code
   * The code to extract the viewbox attribute from.
   * @return {string}
   * @private
   */
  viewbox: NGN.define(false, false, false, function (code) {
    return /(viewbox=["'])(.*?)(["'])/igm.exec(code.toString().trim())[2] || '0 0 100 100'
  }),

  cache: NGN.define(false, false, false, function (url, svg) {
    this._cache[url] = svg
  }),

  fetchFile: NGN.define(false, false, false, function (url, callback) {
    if (_nodeish_env) {
      callback && callback(require('fs').readFileSync(url.replace('file://', '')))
    } else {
      var me = this
      NGN.HTTP.get(url, function (res) {
        callback && callback(res.status !== 200 ? new Error(res.responseText) : me.cleanCode(res.responseText))
      })
    }
  }),

  /**
   * @method update
   * Replace any <img src="*.svg"> with the SVG equivalent.
   * @param {HTMLElement|NodeList} section
   * The HTML DOM element to update. All children of this element will also be updated.
   * @param {function} callback
   * Execute this function after the update is complete.
   */
  update: NGN.define(true, false, false, function (section, callback) {
    if (typeof section === 'function') {
      callback = section
      section = document.body
    } else {
      section = section || document.body
    }

    if (section.nodeName === '#text') {
      return
    }

    var me = this
    section = section.hasOwnProperty('length') === true
      ? NGN._splice(section)
      : [section]

    section.forEach(function (sec) {
      var imgs = sec.querySelectorAll('svg[src]')

      // Loop through images, prime the cache.
      for (var i = 0; i < imgs.length; i++) {
        me._cache[imgs[i].getAttribute('src')] = me._cache[imgs[i].getAttribute('src')] || null
      }

      // Fetch all of the unrecognized svg files
      var unfetched = Object.keys(me._cache).filter(function (url) {
        return me._cache[url] === null
      })
      var remaining = unfetched.length
      unfetched.forEach(function (url) {
        me.fetchFile(url, function (content) {
          if (!(content instanceof Error)) {
            me.cache(url, content)
          }
          remaining--
        })
      })

      // Monitor for download completion
      var monitor = setInterval(function () {
        if (remaining === 0) {
          clearInterval(monitor)
          me.swap(imgs, callback)
        }
      }, 5)
    })
  })
})
