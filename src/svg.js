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
  ss.innerHTML = 'svg[src],svg[id]{display:none;width:0;height:0;}'
  document.head.appendChild(ss)
}
__preventfouc()

// SVG Controller
window.NGN = window.NGN || {}
window.NGN.DOM = window.NGN.DOM || {}
window.NGN.DOM.svg = {}

Object.defineProperties(window.NGN.DOM.svg, {
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
    return code.toString().trim().replace(/(\r\n|\n|\r)/gm, '').replace(/\s+/g, ' ').replace(/(.*<svg.*?>|<\/svg>)/igm, '')
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

  /**
   * @method swap
   * Replace image tags with the SVG equivalent.
   * @param {String|Array} urls
   * The URL(s) of the associated SVG file that should be added to the DOM.
   * @param {function} [callback]
   * Executed when the image swap is complete. There are no arguments passed to the callback.
   * @private
   */
  swap: NGN.define(false, false, false, function (urls, callback) {
    urls = Array.isArray(urls) ? urls : [urls]
    if (urls.length > 0) {
      var collection = document.getElementById('ngn-svg-collection')
      !collection && document.body.insertAdjacentHTML('afterbegin', '<svg id="ngn-svg-collection"/>')

      var unprocessed = urls.length
      var monitor = setInterval(function () {
        if (unprocessed === 0) {
          clearInterval(monitor)
          document.getElementById('ngn-svg-collection').insertAdjacentHTML('beforeend', symbols)
          callback && callback()
        }
      }, 2)

      var symbols = ''
      var me = this

      urls.forEach(function (url) {
        var id = me.id(url)
        if (document.querySelector('#ngn-svg-collection > symbol#' + id) === null && symbols.indexOf('id="' + id + '"') < 0) {
          var src = localStorage.getItem(id)
          if (src) {
            src = src.split('|')
            symbols += '<symbol id="' + id + '" viewBox="' + src[0] + '">' + src[1] + '</symbol>'
            unprocessed--
          } else {
            // Add support for node-ish environments (Electron, NW.js, etc)
            var _module = false
            try {
              _module = require !== undefined
            } catch (e) {}

            if (_module) {
              try {
                var raw = require('fs').readFileSync(url.replace('file://', ''))
                var content = me.cleanCode(raw)
                var viewbox = me.viewbox(raw)
                localStorage.setItem(id, viewbox + '|' + content)
                symbols += '<symbol id="' + id + '" viewBox="' + viewbox + '">' + content + '</symbol>'
              } catch (e) {
                console.error(e.stack)
              }
              unprocessed--
            } else {
              NGN.HTTP.get(url, function (res) {
                if (res.status === 200) {
                  var content = me.cleanCode(res.responseText)
                  var viewbox = me.viewbox(res.responseText)
                  localStorage.setItem(id, viewbox + '|' + content)
                  symbols += '<symbol id="' + id + '" viewBox="' + viewbox + '">' + content + '</symbol>'
                }
                unprocessed--
              })
            }
          }
        } else {
          unprocessed--
        }
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
      var svgs = sec.querySelectorAll('svg[src]')

      // Loop through images, prime the cache.
      var srcs = []
      for (var i = 0; i < svgs.length; i++) {
        srcs.push(svgs[i].getAttribute('src'))
      }
      srcs.length > 0 && me.swap(srcs, function () {
        for (var i = 0; i < svgs.length; i++) {
          svgs[i].innerHTML = '<use xlink:href="#' + me.id(svgs[i].getAttribute('src')) + '"/>'
          svgs[i].removeAttribute('src')
        }
      })
    })
  })
})
