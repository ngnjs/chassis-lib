/**
 * @class NGN.REF
 * A global "pointer" to DOM elements. This is used to reference and manipulate
 * DOM elements in a simple and standard way, without restricting native functionality.
 * Also recognized as NGN.ref.
 * @singleton
 */
'use strict'

if (!NGN.BUS) {
  throw new Error('NGN.REF requires NGN.BUS.')
} else {
  // Wrap the refs in a closure to prevent scope spill
  NGN.REF = function () {
    // Common mixin method
    /**
     * @method find
     * Retrieve the DOM element(s) for the given selector. This method provides
     * an **unmanaged** reference object.
     * @private
     * @param {String} selector
     * The selector (CSS-style).
     * @returns {ref}
     * Returns an instance of the reference.
     */
    const findElement = function (selector, parent) {
      parent = NGN.coalesce(parent, document)
      let elements = parent.querySelectorAll(selector)

      // If there are no elements (such as invalid selector),
      // pass the response through to the caller.
      if (!elements) {
        return undefined
      }

      // If element/s are found, respond with a reference object.
      return new HTMLReferenceElement(elements)
    }

    // Primary collection manager
    class NgnGlobalReferenceManager extends NGN.EventEmitter {
      constructor () {
        super()

        Object.defineProperties(this, {
          collection: NGN.private([]),
          deepcollapse: NGN.private(false),
          _proxyEnabled: NGN.private(true),
          disableProxy: NGN.public(() => {
            this._proxyEnabled = false
          }),
          enableProxy: NGN.public(() => {
            this._proxyEnabled = true
          })
        })
      }

      get keys () {
        let keys = []

        for (let i = 0; i < this.collection.length; i++) {
          keys.push(this.collection[i].key)
          keys.push(this.collection[i].cleanKey)
        }

        return NGN.dedupe(keys)
      }

      /**
       * @property json
       * A JSON representation of the managed keys and their associated selectors.
       * @returns {Object}
       * A key:selector object.
       */
      get json () {
        let data = {}

        for (let i = 0; i < this.collection.length; i++) {
          data[this.collection[i].key] = this.collection[i].selector
          data[this.collection[i].cleanKey] = this.collection[i].selector
        }

        return data
      }

      /**
       * @method enableComplexEventCompression
       * By default, NGN attempts to minimize the number of event
       * handlers applied to the DOM by references. When a reference refers to
       * multiple elements instead of just one, NGN attempts to aggregate event
       * handlers using a simplistic strategy of applying a single event listener
       * to a shared parent node. In most cases, this can reduce "event emitter
       * waste". The simplistic strategy is designed for the 95% use case, wherein
       * most DOM structure references are not very large. However; it is
       * still possible to have complex references. Complex event compression has a
       * native algorithm that finds the least common ancestor (i.e. common DOM
       * element) and applies the event handler to it, distributing events directly
       * to referenced DOM nodes within it. It automatically makes a decision
       * to determine if the gap between nodes is too large (a factor of 3) to
       * effectively determine whether event compression will yield tangible
       * performance gains. If the algorithm does not determine gains, event
       * handlers are applied to individual elements within the reference. Simply
       * put, it falls back to adding an event handler to each referenced element.
       *
       * Since this is not necessary in most cases, it is off by default. Enabling
       * it will perform the analysis and apply efficiencies when possible.
       */
      enableComplexEventCompression () {
        if (!NGN.DOM) {
          console.warn('Complex event compression requires NGN.DOM, which was not found. Complex compression will be ignored.')
          return
        }

        this.deepcollapse = true
      }

      /**
       * @method disableComplexEventCompression
       * Disables complex event compression.
       */
      disableComplexEventCompression () {
        this.deepcollapse = false
      }

      /**
       * @method find
       * A generic find method that finds and returns an element or
       * a collection of elements. This is similar to `document.querySelectorAll`,
       * except it returns an NGN reference.
       * @param {string} selector
       * A CSS selector string representing the.
       */
      find (selector, parent) {
        if (NGN.coalesce(NGN.REF._proxyEnabled, true) && window.hasOwnProperty('Proxy')) {
          return findElement.apply(this, arguments)
        } else {
          let query = findElement.apply(this, arguments)
          return query.length === 1 ? query[0] : query
        }
      }

      /**
       * @method create
       * Add a reference.
       * @param {String} [key]
       * The key/name of the reference. For example, if this is `myElement`,
       * then `ref.myElement` will return a pointer to this reference.
       * @param {string} selector
       * The CSS selector path.
       */
      create (key, selector) {
        let reference = new NgnGlobalReference(key, selector)

        this.collection.push(reference)

        Object.defineProperty(this, key, {
          configurable: true,
          enumerable: true,
          get () {
            return reference.element
          },
          set (newselector) {
            reference.selector = newselector
          }
        })

        Object.defineProperty(this, reference.cleanKey, NGN.private(reference))

        return this[reference.cleanKey]
      }

      /**
       * @method remove
       * Removes a key from the reference manager.
       * @param {string} name
       * The name of the reference.
       */
      remove (key) {
        if (!key) {
          return
        }

        let reference = this.collection.findIndex((ref) => {
          return ref.key === key
        })

        if (reference < 0) {
          return
        }

        this.collection.splice(reference, 1)
      }
    }

    class HTMLReferenceElement {
      constructor (element) {
        Object.defineProperties(this, {
          source: NGN.private(NGN.slice(element))
        })

        const me = this

        // Setup proxy traps if the browser is new enough.
        if (NGN.coalesce(NGN.REF._proxyEnabled, true) && window.hasOwnProperty('Proxy')) {
          return new Proxy(this, {
            get (target, property) {
              if (me.source.length === 1) {
                return NGN.coalesce(target[property], me.source[0][property], me.source[property]) || undefined
              } else if (me.source.length > 1) {
                return NGN.coalesce(target[property], me.source[property]) || undefined
              }
            },

            set (target, property, value) {
              if (me.source.length === 1) {
                me.source[0][property] = value
              } else if (me.source.hasOwnProperty(property)) {
                me.source[property] = value
              }

              return true
            }
          })
        } else {
          const methods = [
            'on',
            'off',
            'once',
            'onceoff',
            'pool',
            'forward',
            'setMaxListeners',
            'getMaxListeners',
            'enhancedEventManager',
            'getCollapsedDomStructure',
            'querySelector',
            'querySelectorAll',
            'find'
          ]

          // If there are multiple elements, apply each method to the array.
          for (let i = 0; i < methods.length; i++) {
            this.source[methods[i]] = this.applyMultiMethod(this[methods[i]])
          }

          // For each source, apply each method.
          for (let s = 0; s < this.source.length; s++) {
            // Add methods
            for (let i = 0; i < methods.length; i++) {
              this.source[s][methods[i]] = function () {
                return me[methods[i]].apply(me.source[s], arguments)
              }
            }
          }

          return this.source.length === 1 ? this.source[0] : this.source
        }
      }

      applyMultiMethod (fn) {
        const me = this
        return function () {
          for (let i = 0; i < me.source.length; i++) {
            fn.apply(me.source[i], arguments)
          }
        }
      }

      /**
       * @property {Number} length
       * The number of elements in the reference.
       */
      get length () {
        return this.source.length
      }

      /**
       * @property {HTMLElement|[HTMLElement]} DOMElement
       * Returns the referenced HTMLElement or an array of the HTMLElements
       * matching the reference selector.
       * @readonly
       */
      get DOMElement () {
        return this.source.length === 1 ? this.source[0] : this.source
      }

      // Re-alias the standard event listener to support enhanced pooling
      addEventListener () {
        this.on(...arguments)
      }

      on (eventName, handlerFn) {
        if (typeof eventName === 'object') {
          this.pool(...arguments)
        } else {
          this.enhancedEventManager('addEventListener', ...arguments)
        }
      }

      once (eventName, handlerFn) {
        const me = this
        const fn = function () {
          handlerFn.apply(...arguments)
          // console.log('Turning off event handler')
          me.off(eventName, fn)
        }

        this.on(eventName, fn)
      }

      // Re-alias the standard event listener remover to support enhanced pooling
      removeEventListener () {
        this.off(...arguments)
      }

      off (eventName, handlerFn) {
        this.enhancedEventManager('removeEventListener', ...arguments)
      }

      onceoff (eventName, handlerFn) {
        this.off(...arguments)
      }

      pool (prefix, group, callback) {
        NGN.BUS.pool.apply(this, arguments)
      }

      // Helper methods specifically to prevent the pool method from breaking.
      setMaxListeners () {}
      getMaxListeners () { return 0 }

      enhancedEventManager (type, eventName, handlerFn) {
        if (!NGN.isFn(handlerFn)) {
          throw new Error(`Invalid event handler for %c${eventName}%c (not a function)`, NGN.css, '')
        }

        this.source = this.source ? this.source : [this]

        switch (this.source.length) {
          case 0:
            return

          case 1:
            this.source[0][type](eventName, handlerFn)
            break

          default:
            const me = this
            const targetNodes = this.getCollapsedDomStructure()

            // Pool events on the parent node when applicable.
            for (let i = 0; i < targetNodes.length; i++) {
              if (type === 'addEventListener') {
                targetNodes[i].addEventListener(eventName, function (evt) {
                  if (me.source.includes(evt.target)) {
                    handlerFn(...arguments)
                  }
                })
              } else {
                targetNodes[i].removeEventListener(eventName, handlerFn)
              }
            }
        }
      }

      /**
       * @method getCollapsedDomStructure
       * Retrieves the most effective DOM elements to apply event handlers
       * to when multiple elements are selected.
       */
      getCollapsedDomStructure () {
        // If there's only one element, ignore this operation.
        if (this.source.length <= 1) {
          return this.source
        }

        // Attempt simplistic collapse using parent nodes
        // This is the most common code structure.
        let parentNodes = NGN.dedupe(this.source.map((node) => {
          return node.parentNode
        }))

        if ((parentNodes.length / this.source.length) < 0.5) {
          return parentNodes
        }

        if (!this.deepcollapse) {
          return this.source
        }

        // If complex event compression is configured, apply it.
        let ancestor = NGN.DOM.getCommonAncestorDetail(this.source)

        // If the avg is less than the median, the spread is
        // "skewed" and may not benefit from compression. If the
        // average is over 10, the structure is deeply nested and
        // potentially contains many elements to scan through.
        // It's unlikely event collapsing will be beneficial in
        // either of these cases.
        if (ancestor.gap.average < ancestor.gap.median || ancestor.gap.average >= 10) {
          return this.source
        }

        if (ancestor === document.body) {
          return this.source
        }

        return [ancestor.element]
      }

      querySelector (selector) {
        return this.querySelectorAll(selector)[0]
      }

      querySelectorAll () {
        return this.find(...arguments)
      }

      find (selector) {
        if (this.hasOwnProperty('source')) {
          if (this.source.length === 1) {
            return findElement(selector, this.source[0])
          } else {
            return findElement(`${this.selector} ${selector}`)
          }
        } else {
          // return new NgnReference(`${NGN.DOM.getElementSelector(this)} ${selector}`)
          let elements = document.querySelectorAll(`${NGN.DOM.getElementSelector(this)} ${selector}`)

          if (elements.length === 0) {
            return elements
          }

          return new HTMLReferenceElement(elements)
        }
      }

      /**
       * @method forward
       * Forwards a DOM/Element event to the NGN.BUS. See @NGN.BUS#forward for
       * additional details.
       * @param {string} sourceEvent
       * The source event triggered by the DOM element(s).
       * @param {string} targetEvent
       * The event fired on the NGN.BUS when the sourceEvent is fired.
       * @param {Boolean} [preventDefault=false]
       * Optionally prevent the default event from happning. This is
       * the equivalent of adding `event.preventDefault()` at the beginning
       * of an event handler.
       */
      forward (sourceEvent, targetEvent, preventDefault = false) {
        this.on(sourceEvent, (evt) => {
          if (preventDefault) {
            evt.preventDefault()
          }

          NGN.BUS.emit(targetEvent, evt)
        })
      }
    }

    class NgnReference extends NGN.EventEmitter {
      constructor (selector) {
        super()

        this.validateSelector(selector)

        Object.defineProperties(this, {
          _selector: NGN.private(selector)
        })
      }

      get selector () {
        return this._selector
      }

      set selector (newselector) {
        this.validateSelector(newselector)

        let old = this._selector
        this._selector = newselector

        this.emit('selector.changed', {
          old: old,
          new: newselector
        })
      }

      get element () {
        if (NGN.coalesce(NGN.REF._proxyEnabled, true) && window.hasOwnProperty('Proxy')) {
          return this.find(this.selector)
        }

        let el = this.find(this.selector)

        return el.length === 1 ? el[0] : el
      }

      /**
       * @method validateSelector
       * Validate the DOM selector path. This is a void function that throws
       * an error if the selector is invalid.
       * @param {string} selector
       * The DOM selector.
       * @private
       */
      validateSelector (selector) {
        // Basic error checking
        if (typeof name !== 'string' && typeof name !== 'number') {
          throw new Error('Cannot add a non-alphanumeric selector reference.')
        }

        if (NGN.coalesce(selector, '').trim().length === 0) {
          throw new Error('Cannot create a blank/null/undefined reference selector.')
        }
      }

      find (selector) {
        return findElement.apply(this, arguments)
      }
    }

    class NgnGlobalReference extends NgnReference {
      constructor (name, selector) {
        super(selector)

        // If the key is not provided but the selector is a DOM element, make
        // an ephemeral reference.
        if (!selector && typeof name !== 'string') {
          return this.find(name)
        }

        Object.defineProperties(this, {
          key: NGN.private(name)
        })
      }

      /**
       * @method cleanKey
       * Creates a clean version of the key used to uniquely identify the reference.
       * @private
       * @param {String} key
       * The key to clean.
       */
      get cleanKey () {
        return this.key.replace(/[^A-Za-z0-9\_\#\$\@\-\+]/gi, '') + this.key.length // eslint-disable-line no-useless-escape
      }
    }

    return new NgnGlobalReferenceManager()
  }

  NGN.REF = new NGN.REF()

  Object.defineProperty(NGN, 'ref', NGN.get(() => {
    return NGN.REF
  }))
}
