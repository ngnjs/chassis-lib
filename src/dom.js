/**
 * @class DOM
 * A utility class to simplify some DOM management tasks.
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
   * an array of `HTMLElements`/`NodeList`/CSS Selectors.
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
   * @method guarantee
   * This method executes a callback function when it recognizes
   * the insertion of a DOM element. It is a good way to guarantee
   * a new DOM element exists before doing anything (such as
   * adding an event listener). This method is not always necessary, but it is
   * extremely handy when importing remote HTML templates over less than
   * reliable connections, or when the remote code is not what you expect.
   *
   * Functionally, this differs from Promises and script loaders. An optimized
   * mutation observer monitors the parent element for insertion of a child element.
   * The mutation observer will not trigger a response until an element actually
   * exists in the DOM. When the mutation observer recognizes a new element,
   * the element is compared to the selector element. If the selector does
   * **not** match the new element, nothing happens. If the selector **matches**
   * the new element, the callback is triggered and the mutation observer
   * is removed.
   *
   * **Example**
   *
   * ```js
   * NGN.DOM.guarantee(document, '#myButton', function (err, element) {
   *   if (err) {
   *     throw err
   *   }
   *
   *   element.addEventListener('click', function (e) {
   *     console.log('Button Clicked')
   *   })
   * })
   *
   * setTimeout (function () {
   *   document.insertAdjacentHTML('beforeend', '<button id="myButton">Click Me</button>')
   * }, 2000)
   * ```
   *
   * In this example, a new button is added to the DOM two seconds after the page
   * renders. The guarantee monitors the `document` for an HTMLElement that matches
   * `document.querySelector('#myButton')`. Once the element is recognized,
   * an event listener is applied to the element.
   *
   * The net result of this is a button will appear on the page. When a user clicks
   * the button, it will say `Button Clicked` in the console.
   * @param {HTMLElement|String} parent
   * This DOM element will be monitored for changes. **Only direct child nodes
   * within this element will trigger the callback**. This parameter may be a
   * real DOM element or a CSS selector.
   * @param {HTMLElement|String} selector
   * This selector is used to match the new element. This can be a CSS selector,
   * or it can be an HTMLElement.
   * @param {Number} [timeout]
   * Optionally set a timeout (milliseconds). If the new method is not recognized
   * within this time, the callback will be triggered with an error.
   * @param {Function} callback
   * The method executed when the DOM element is guaranteed to exist.
   * This method receives two arguments. The first is an error, which will be
   * `null` if everything works. The second argument is a reference to the
   * new element (an HTMLElement).
   */
  guarantee: NGN.const((parent, selector, timeout, callback) => {
    if (typeof timeout === 'function') {
      callback = timeout
      timeout = null
    }

    let match = (node) => {
      clearTimeout(timeout)
      callback(null, node)
      observer.disconnect()
    }

    // Create Mutation Observer
    let observer = new MutationObserver((mutations) => {
      // Iterate through mutations
      for (let mutation in mutations) {
        // Only check child node modifications
        if (mutations[mutation].type === 'childList') {
          // Only check nodes inserted directly into the parent
          for (let node = 0; node < mutations[mutation].addedNodes.length; node++) {
            let currentNode = mutations[mutation].addedNodes[node]
            if (typeof selector === 'string') {
              try {
                // If the selector is a string, try to compare a query selector to the new child.
                if (parent.querySelector(selector) === currentNode) {
                  return match(currentNode)
                }
              } catch (e) {
                // If the selector is a string but throws an invalid query selector error,
                // it is most likely a document fragment or text representation of an HTMLElement.
                // In this case, compare the new child node's outerHTML to the selector for a match.
                let selectorItem = NGN.DOM.expandVoidHTMLTags(selector).toString().trim().toUpperCase()
                let addedItem = currentNode.outerHTML.toString().trim().toUpperCase()

                if (selectorItem === addedItem) {
                  return match(currentNode)
                }
              }
            } else if (selector instanceof HTMLElement && selector === mutations[mutation].addedNodes[node]) {
              // If the selector is an HTMLElement and matches the new child, a match has occurred.
              return match(currentNode)
            }
          }
        }
      }
    })

    // Apply the observer to the parent element.
    observer.observe(parent, {
      childList: true,
      subtree: false
    })

    // If a timeout is specified, begin timing.
    if (timeout !== null && typeof timeout === 'number') {
      timeout = setTimeout(() => {
        observer.disconnect()
        callback(new Error('Guarantee timed out while waiting for ' + selector))
      }, timeout)
    }
  }),

  expandVoidHTMLTags: NGN.privateconst((content) => {
    // Regex Parsers
    let voidTags = /<[^>]*\/>/gi
    let tagName = /<([^\s\/\\]+)/i
    let code = voidTags.exec(content)

    while (code !== null) {
      let tag = tagName.exec(code[0])
      content = content.replace(new RegExp(code[0], 'gim'), code[0].replace(/(\\|\/)>/gi, '>') + '</' + tag[1] + '>')
      code = voidTags.exec(content)
    }

    return content
  }),

  /**
   * @method findParent
   * Find a distant parent of a DOM element. This can be thought
   * of as a reverse CSS selector that traverses UP the DOM chain
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
   * to its parent element.
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
