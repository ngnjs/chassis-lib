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
 * AFTER the sVG images are loaded, meaning they may display briefly before
 * proper styling can be applied to the DOM.
 */

// Prevent FOUC
(function () {
  var ss = document.createElement('style')
  var str = document.createTextNode('img[src$=".svg"]{display:none}svg.loading{height:0px !importantwidth:0px !important}')
  ss.appendChild(str)
  document.head.appendChild(ss)
})()

// SVG Controller
window.NGN.DOM.svg = {}

Object.defineProperties(window.NGN.DOM.svg, {
  /**
   * @property {Object} cache
   * A cache of SVG images.
   */
  cache: NGN.define(false, false, true, {}),

  /**
   * @method swap
   * Replace image tags with the SVG equivalent.
   * @param {HTMLElement|NodeList} imgs
   * The HTML element or node list containing the images that should be swapped out for SVG files.
   * @param {function} [callback]
   * Executed when the image swap is complete. There are no arguments passed to the callback.
   * @private
   */
  swap: NGN.define(false, false, false, function (imgs, callback) {
    for (var x = 0; x < imgs.length; x++) {
      var img = imgs[x]
      if (NGN.DOM.svg.cache[img.src] !== null && img !== null && img.parentNode !== null) {
        var svg = NGN.DOM.svg.cache[img.src].cloneNode(true)
        var attr = img.attributes
        for (var y = 0; y < attr.length; y++) {
          if (img.hasAttribute(attr[y].name) && attr[y].name.toLowerCase() !== 'src') {
            svg.setAttribute(attr[y].name, attr[y].value)
          }
        }
        if (svg.classList) {
          for (var i = 0; i < img.classList.length; i++) {
            svg.classList.add(img.classList[i])
          }
        } else {
          svg.setAttribute('class', img.getAttribute('class'))
        }
        img.parentNode.replaceChild(svg, img)
      }
    }
    callback && callback()
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

    section = section.hasOwnProperty('length') === true
      ? NGN._splice(section)
      : [section]

    section.forEach(function (sec) {
      var imgs = sec.querySelectorAll('img[src$=".svg"]')

      // Loop through images, prime the cache.
      for (var i = 0; i < imgs.length; i++) {
        NGN.DOM.svg.cache[imgs[i].src] = NGN.DOM.svg.cache[imgs[i].src] || null
      }

      // Get all of the unrecognized svg files
      var processed = 0
      var cache = function (url, innerHTML) {
        var tag = document.createElement('div')
        tag.innerHTML = innerHTML
        NGN.DOM.svg.cache[url] = tag.querySelector('svg')
        NGN.DOM.svg.cache[url].removeAttribute('id')
        NGN.DOM.svg.cache[url].removeAttribute('xmlns:a')
      }

      Object.keys(NGN.DOM.svg.cache).forEach(function (url) {
        var _module = false
        try {
          _module = require !== undefined
        } catch (e) {}

        if (_module) {
          // Add support for node-ish environment (nwjs/electron)
          try {
            cache(url, require('fs').readFileSync(url.replace('file://', '')).toString())
          } catch (e) {
            console.log(e.stack)
          }
          processed++
        } else {
          // Original Browser-Based Vanilla JS using the AJAX lib.
          NGN.HTTP.get(url, function (res) {
            res.status === 200 && cache(url, res.responseText)
            processed++
          })
        }
      })

      // Monitor for download completion
      var monitor = setInterval(function () {
        if (processed === Object.keys(NGN.DOM.svg.cache).length) {
          clearInterval(monitor)
          NGN.DOM.svg.swap(imgs, callback)
        }
      }, 5)
    })
  })
})
