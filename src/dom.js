/**
 * @class DOM
 * A utility class to simplify smoe DOM management tasks.
 */
NGN.DOM = {}

Object.defineProperties(NGN.DOM, {
  /**
   * @method ready
   * Executes code after the DOM is loaded.
   * @param {function} callback
   * The function to call when the DOM is fully loaded.
   */
  ready: NGN.const(function (callback) {
    document.addEventListener('DOMContentLoaded', callback)
  }),

  /**
   * @method destroy
   * Remove a DOM element.
   * @param {HTMLElement|NodeList|String|Array} node
   * Accepts a single `HTMLElement`, a `NodeList`, a CSS selector, or
   * an array or `HTMLElements`/`NodeList`/CSS Selectors.
   */
  destroy: NGN.const(function (element) {
    // Process a CSS selector
    if (typeof element === 'string') {
      let str = element
      element = document.querySelectorAll(element)

      if (element.length === 0) {
        console.warn('The \"' + str + '\" selector did not return any elements.')
        return
      }
      // Iterate through results and remove each element.
      NGN.slice(element).forEach(this.destroy)
    } else {
      switch (NGN.typeof(element)) {
        case 'array':
          element.forEach(this.destroy)
          return
        case 'nodelist':
          NGN.slice(element).forEach(this.destroy)
          return
        case 'htmlelement':
          element.parentNode.removeChild(element)
          return
        default:
          if (/^html.*element$/.test(NGN.typeof(element))) {
            element.parentNode.removeChild(element)
            return
          }
          console.warn('An unknown error occurred while trying to remove DOM elements.')
          console.log('Unknown Element', element)
      }
    }
  }),

  /**
   * @method findParent
   * Find a distant parent of a DOM element. This can be thought
   * of as a reverse CSS selector that traverse UP the DOM chain
   * to find the parent element.
   *
   * For example:
   *
   * Assume the following HTML structure & JS code:
   *
   * ```html
   * <section>
   *   <header class="MyGroup">
   *     <div>
   *       <div>
   *         <button>Delete Entire Group</button>
   *       </div>
   *     </div>
   *   </header>
   * </section>
   * ```
   *
   * ```js
   * ref.find('button.remove').addEventListener('click', function (event) {
   *   event.preventDefault()
   *   let removeButton = event.currentTarget
   *   let group = ref.findParent(removeButton,'header')
   *   ref.destroy(group)
   * })
   * ```
   *
   * The code above listens for a click on the button. When the button
   * is clicked, the `findPerent` method recognizes the "Delete Entire Group"
   * button and traverses UP the DOM chain until it finds a `header` DOM
   * element. The `header` DOM element is returned (as `group` letiable). The
   * group is then removed using the `ref.destroy` method.
   *
   * Alternatively, the same effect could have been achieved if line 4
   * of the JS code was:
   * ```js
   * let group = ref.findParent(removeButton, '.MyGroup')
   * ```
   * @param {HTMLElement|String} element
   * The DOM element or a CSS selector string identifying the
   * element whose parent should be found.
   * @param {String} selector
   * A minimal CSS selector used to identify the parent.
   * @param {Number} maxDepth
   * The maximum number of elements to traverse. This can be used to
   * cap a selector and force it to fail before reaching a known limit.
   * By default, there is no limit (i.e. maxDepth=null).
   * @returns {HTMLElement}
   * Responds with the DOM Element, or `null` if none was found.
   */
  findParent: NGN.const(function (node, selector, maxDepth) {
    if (typeof node === 'string') {
      node = document.querySelectorAll(node)
      if (node.length === 0) {
        console.warn('\"' + node + '\" is an invalid CSS selector (Does not identify any DOM elements).')
        return null
      }
      node = node[0]
    }

    let currentNode = node.parentNode
    let i = 0
    maxDepth = typeof maxDepth === 'number' ? maxDepth : -1

    while (currentNode.parentNode.querySelector(selector) === null && currentNode.nodeName !== 'BODY') {
      i++
      if (maxDepth > 0 && i > maxDepth) {
        return null
      }
      currentNode = currentNode.parentNode
    }

    return currentNode
  }),

  /**
   * @method indexOfParent
   * Returns the zero-based index of the DOM element related
   * to it's parent element.
   * For example:
   *
   * `html
   * <div>
   *   <p>...</p>
   *   <p>...</p>
   *   <button id="btn"></button>
   *   <p>...</p>
   * </div>
   * ```
   *
   * ```js
   * let i = NGN.DOM.indexOfParent(document.getElementById('btn'))
   * console.log(i) // 2
   * ```
   * @param {HTMLElement} el
   * The reference element.
   * @returns {number}
   */
  indexOfParent: NGN.const(function (element) {
    return NGN.slice(element.parentNode.children).indexOf(element)
  })
})
