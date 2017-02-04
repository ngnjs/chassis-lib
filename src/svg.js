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
  _cache: NGN.private({}),

  /**
   * @method swap
   * Replace image tags with the SVG equivalent.
   * @param {HTMLElement|NodeList} imgs
   * The HTML element or node list containing the images that should be swapped out for SVG files.
   * @param {function} [callback]
   * Executed when the image swap is complete. There are no arguments passed to the callback.
   * @private
   */
  swap: NGN.privateconst(function (element, callback) {
    let me = this
    let svgs = element.querySelectorAll('svg[src]')

    for (let i = 0; i < svgs.length; i++) {
      let attr = svgs[i].attributes
      let source = me._cache[svgs[i].getAttribute('src')]
      let firstLine = source.split(/>\s{0,100}</i)[0] + '>'
      let sourceattrs = this.getAttributes(firstLine)

      let newattrs = []
      for (let a = 0; a < attr.length; a++) {
        if (attr[a].name.toLowerCase() !== 'src') {
          newattrs.push(attr[a].name.toLowerCase() + '=\"' + attr[a].value + '\"')
        }
      }

      sourceattrs.filter((a) => {
        let match = newattrs.filter((na) => {
          return na.toLowerCase().indexOf(a.split('=')[0].toLowerCase()) === 0
        })

        return match.length === 0
      })

      let attrs = newattrs.concat(sourceattrs)

      svgs[i].outerHTML = source.replace(firstLine, '<svg ' + attrs.join(' ') + '>')
    }

    callback && callback()
  }),

  getAttributes: NGN.privateconst(function (output) {
    let attrs

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
      let value = els.split('=')
      return value[0].toLowerCase() + '=' + value[1]
    }).filter(function (value) {
      return value.substr(0, 4) !== 'src='
    })

    return map
  }),

  /**
   * @method applySvg
   * Using text, such as innerHTML, find and replace <svg src=".."> tags
   * with the appropriate SVG file content. This is a pre-render method.
   * @param {string} source
   * The source text.
   * @param {function} callback
   * Executed when the SVG content has been completely applied to the source
   * string.
   * @param {string} callback.content
   * The final output.
   * @returns {string}
   * The updated content.
   * @private
   */
  applySvg: NGN.privateconst(function (src, callback) {
    let tags = this.getSvgReferences(src)
    tags.forEach((url) => {
      let re = new RegExp('<svg.*src=(\'|\")' + url + '(\'|\").*(svg|\/|\"|\')>', 'gi')
      // let re = new RegExp('<svg.*src=(\'|\")' + url + '(\'|\").*>', 'gi')
      let code = re.exec(src)
      let ct = 0

      if (!this._cache.hasOwnProperty(url)) {
        console.warn('Invalid SVG content for ' + url)
      } else {
        while (code !== null && ct < 200) {
          let source = this._cache[url]
          let firstLine = source.split(/>\s{0,100}</i)[0] + '>'
          let sourceattrs = this.getAttributes(firstLine)
          let newattrs = this.getAttributes(code[0])

          sourceattrs = sourceattrs.filter((a) => {
            let match = newattrs.filter((na) => {
              return na.toLowerCase().indexOf(a.split('=')[0].toLowerCase()) === 0
            })

            return match.length === 0
          })

          let attr = newattrs.concat(sourceattrs)

          source = source.replace(firstLine, '<svg ' + attr.join(' ') + '>')
          src = src.replace(code[0], source)
          code = re.exec(src)
          ct++
        }
      }
    })

    callback(src)
  }),

  /**
   * @method id
   * @param  {string} url
   * Create an ID that can be used to reference an SVG symbol.
   * @return {string}
   * @private
   */
  id: NGN.privateconst(function (url) {
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
  cleanCode: NGN.privateconst(function (code) {
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
  viewbox: NGN.privateconst(function (code) {
    return /(viewbox=["'])(.*?)(["'])/igm.exec(code.toString().trim())[2] || '0 0 100 100'
  }),

  cache: NGN.private(function (url, svg) {
    this._cache[url] = svg
  }),

  fetchFile: NGN.private(function (url, callback) {
    if (!callback) {
      return
    }

    if (!NGN.nodelike || url.indexOf('http') === 0 || window !== undefined) {
      let me = this
      NGN.NET.get(url, function (res) {
        if (NGN.isFn(callback)) {
          if (res.status === 200) {
            if (res.responseText.indexOf('<svg') < 0) {
              callback(new Error(url + ' does not contain valid SVG content.'))
            } else {
              callback(me.cleanCode(res.responseText))
            }
          } else {
            callback(new Error(res.responseText))
          }
        }
      })
    } else {
      let content = ''

      try {
        content = require('fs').readFileSync(require('path').resolve(url).replace('file://', '')).toString()
      } catch (e) {
        try {
          content = require('fs').readFileSync(require('path').resolve(__dirname, url).replace('file://', '')).toString()
        } catch (ee) {}
      }

      callback(content)
    }
  }),

  getSvgReferences: NGN.privateconst(function (html) {
    let re = /<svg.*\/(svg>|>)/mig
    let urls = []
    let code = re.exec(html)

    while (code !== null) {
      html = html.replace(new RegExp(code[0], 'gim'), '')

      // let url = /src=(\'|\")(.*)(\'|\")/i.exec(code[0])[2]
      let url = /src=(\'|\")(.*)(\'|\")/i.exec(code[0])[2].split(' ')[0].replace(/\"|\'/gi, '')

      if (urls.indexOf(url) < 0) {
        urls.push(url)
      }

      re.exec(html)
      code = re.exec(html)
    }

    return urls
  }),

  precache: NGN.privateconst(function (urlList, callback) {
    let remaining = urlList.length

    urlList.forEach((url) => {
      this.fetchFile(url, (content) => {
        if (!(content instanceof Error)) {
          this.cache(url, content)
        }

        remaining--
      })
    })

    if (remaining === 0) {
      return callback()
    }

    let monitor = setInterval(function () {
      if (remaining === 0) {
        clearInterval(monitor)
        callback()
      }
    }, 5)
  }),

  /**
   * @method update
   * Replace any <img src="*.svg"> with the SVG equivalent.
   * @param {HTMLElement|NodeList} section
   * The HTML DOM element to update. All children of this element will also be updated.
   * @param {function} callback
   * Execute this function after the update is complete.
   */
  update: NGN.const(function (section, callback) {
    if (typeof section === 'function') {
      callback = section
      section = document.body
    } else {
      section = section || document.body
    }

    // If the section is text (i.e. not yet rendered to DOM),
    // replace via regex.
    if (typeof section === 'string') {
      let newtags = this.getSvgReferences(section).filter((url) => {
        return !this._cache[url]
      })

      this.precache(newtags, () => {
        this.applySvg(section, callback)
      })

      return
    }

    // If the node is text, there are no SVG tags.
    if (section.nodeName === '#text') {
      return
    }

    section = section.hasOwnProperty('length') === true
      ? NGN.splice(section)
      : [section]

    section.forEach((sec) => {
      let imgs = sec.querySelectorAll('svg[src]')
      let newtags = []

      // Loop through images, prime the cache.
      for (let i = 0; i < imgs.length; i++) {
        let urls = this.getSvgReferences(imgs[i].outerHTML)
        urls.forEach((url) => {
          if (!this._cache[url] && newtags.indexOf(url) < 0) {
            newtags.push(url)
          }
        })
      }

      this.precache(newtags, () => {
        this.swap(sec, callback)
      })
    })
  })
})
