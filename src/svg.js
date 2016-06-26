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
// (function () {
//   let ss = document.createElement('style')
//   let str = document.createTextNode('svg[src]{display:none}svg.loading{height:0px !important;width:0px !important}')
//   ss.appendChild(str)
//   document.head.appendChild(ss)
// })()
const fuoc = function () {
  var ss = document.createElement('style')
  var str = document.createTextNode('svg[src]{display:none}svg.loading{height:0px !important;width:0px !important}')
  ss.appendChild(str)
  document.head.appendChild(ss)
}
fuoc()

// SVG Controller
NGN.DOM = NGN.DOM || {}
NGN.DOM.svg = {}

Object.defineProperties(NGN.DOM.svg, {
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
  swap: NGN.const(false, false, false, function (svgs, callback) {
    let me = this
    for (let i = 0; i < svgs.length; i++) {
      let attr = svgs[i].attributes
      let output = me._cache[svgs[i].getAttribute('src')]
      let attrs = []

      try {
        attrs = /<svg(\s.*=[\"\'].*?[\"\'])?>/i.exec(output)[1].trim()
        let sep = /[\"\']\s/i.exec(attrs)
        sep = sep !== null ? sep[0] : '\" '
        attrs = attrs.replace(new RegExp(sep, 'gi'), sep.replace(/\s/ig, ',')).split(',')
      } catch (e) {
        console.error(e)
      }

      attrs = Array.isArray(attrs) ? attrs : [attrs]

      let map = attrs.map(function (els) {
        return els.split('=')[0].trim().toLowerCase()
      })

      for (let x = 0; x < attr.length; x++) {
        let idx = map.indexOf(attr[x].name.toLowerCase())
        if (idx < 0) {
          attrs.push(attr[x].name + '="' + attr[x].value + '"')
        } else {
          attrs[idx] = attr[x].name + '="' + attr[x].value + '"'
        }
      }

      attrs = attrs.filter(function (a) {
        return a.split('=')[0].toLowerCase() !== 'src'
      })

      let svg = '<svg ' + attrs.join(' ') + '>'

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
  id: NGN.const(false, false, false, function (url) {
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
  cleanCode: NGN.const(false, false, false, function (code) {
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
  viewbox: NGN.const(false, false, false, function (code) {
    return /(viewbox=["'])(.*?)(["'])/igm.exec(code.toString().trim())[2] || '0 0 100 100'
  }),

  cache: NGN.const(false, false, false, function (url, svg) {
    this._cache[url] = svg
  }),

  fetchFile: NGN.const(false, false, false, function (url, callback) {
    if (NGN.nodelike) {
      callback && callback(require('fs').readFileSync(require('path').resolve(url).replace('file://', '')).toString())
    } else {
      let me = this
      NGN.NET.get(url, function (res) {
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

    let me = this
    section = section.hasOwnProperty('length') === true
      ? NGN._splice(section)
      : [section]

    section.forEach(function (sec) {
      let imgs = sec.querySelectorAll('svg[src]')

      // Loop through images, prime the cache.
      for (let i = 0; i < imgs.length; i++) {
        me._cache[imgs[i].getAttribute('src')] = me._cache[imgs[i].getAttribute('src')] || null
      }

      // Fetch all of the unrecognized svg files
      let unfetched = Object.keys(me._cache).filter(function (url) {
        return me._cache[url] === null
      })

      let remaining = unfetched.length
      unfetched.forEach(function (url) {
        me.fetchFile(url, function (content) {
          if (!(content instanceof Error)) {
            me.cache(url, content)
          }
          remaining--
        })
      })

      // Monitor for download completion
      let monitor = setInterval(function () {
        if (remaining === 0) {
          clearInterval(monitor)
          me.swap(imgs, callback)
        }
      }, 5)
    })
  })
})
