'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class DATA.Model
 * A data model.
 * @fires field.modified
 * Fired when a datafield value is changed.
 */
window.NGN.DATA.Model = function (config) {
  config = config || {}

  var me = this

  Object.defineProperties(this, {

    emit: NGN.define(false, false, false, function (topic) {
      if (window.NGN.BUS) {
        NGN.BUS.emit.apply(NGN.BUS, arguments)
      } else {
        console.info(topic)
      }
    }),

    /**
     * @cfg {String} [idAttribute='id']
     * Setting this allows an attribute of the object to be used as the ID.
     * For example, if an email is the ID of a user, this would be set to
     * `email`.
     */
    idAttribute: NGN.define(false, false, false, config.idAttribute || 'id'),

    /**
     * @property {Object}
     * A private object containing the data fields of the model, including
     * validators & default values.
     * @private
     */
    fields: NGN.define(false, true, true, config.fields || {
      /**
       * @datafield {String} [id=null]
       * The unique ID of the person.
       */
      id: {
        required: true,
        type: String,
        'default':	config.id || null
      }
    }),

    /**
     * @property {Object}
     * A private object containing virtual data attributes and generated data.
     * @private
     */
    virtuals: NGN.define(false, true, true, config.virtuals || {}),

    /**
     * @property {Object}
     * The validation rules used to verify data integrity when persisting to a datasource.
     * @private
     */
    validators: NGN.define(false, true, false, {}),

    /**
     * @property {Boolean}
     * Indicates the model is new or does not exist according to the persistence store.
     * @private
     * @readonly
     */
    isNew: NGN.define(false, true, false, true),

    /**
     * @property {Boolean}
     * Indicates the model has been destroyed/deleted and should no longer exist.
     * @private
     * @readonly
     */
    isDestroyed: NGN.define(false, true, false, false),

    /**
     * @property {Boolean}
     * Indicates one or more data properties has changed.
     * @readonly
     */
    modified: NGN.define(true, true, false, false),

    /**
     * @property {String} [oid=null]
     * The raw object ID, which is either the #id or #idAttribute depending
     * on how the object is configured.
     * @private
     */
    oid: NGN.define(false, true, true, config[this.idAttribute] || null),

    /**
     * @cfg {String/Number/Date} [id=null]
     * The unique ID of the model object.
     */
    /**
     * @property {String/Number/Date} [id=null]
     * The unique ID of the model object. If #idAttribute is defined,
     * this will get/set the #idAttribute value.
     */
    id: {
      enumerable:	true,
      get: function () {
        return this.oid
      },
      set: function (value) {
        this[this.idAttribute] = value
        this.oid = value
      }
    },

    /**
     * @cfg {Boolean} [allowInvalidSave=false]
     * Set this to true to allow a save even though not all of the data properties
     * pass validation tests.
     */
    allowInvalidSave: NGN.define(false, true, false, NGN.coalesce(config.allowInvalidSave, false)),

    /**
     * @cfg {Boolean} [disableDataValidation=false]
     * Only used when #save is called. Setting this to `true` will bypass data validation.
     */
    disableDataValidation: NGN.define(false, true, false, NGN.coalesce(config.disableDataValidation, false)),

    invalidDataAttributes: NGN.define(false, true, false, []),

    initialDataAttributes: NGN.define(false, true, false, []),

    /**
     * @property {Boolean}
     * Stores whether the object is considered fetched.
     * @private
     */
    fetched: NGN.define(false, true, false, false),

    /**
     * Indicates the model has been configured
     */
    initialized: NGN.define(false, true, false, false),

    /**
     * @property {Object[]}
     * An ordered array of changes made to the object data properties.
     * This should not be changed manually. Instead, use #getChangeLog
     * and #rollback to manage this list.
     * @private
     */
    changelog: NGN.define(false, true, false, []),

    _nativeValidators: NGN.define(false, false, false, {
      min: function (min, value) {
        if (value instanceof Array) {
          return value.length >= min
        }
        if (value instanceof Number) {
          return value >= min
        }
        if (value instanceof String) {
          return value.trim().length >= min
        }
        if (value instanceof Date) {
          return value.parse() >= min.parse()
        }
        return false
      },
      max: function (max, value) {
        if (value instanceof Array) {
          return value.length <= max
        }
        if (value instanceof Number) {
          return value <= max
        }
        if (value instanceof String) {
          return value.trim().length <= max
        }
        if (value instanceof Date) {
          return value.parse() <= max.parse()
        }
        return false
      },
      'enum': function (valid, value) {
        return valid.indexOf(value) >= 0
      },
      required: function (field) {
        return this.hasOwnProperty(field)
      }
    }),

    /**
     * @cfg {Object} dataMap
     * An object mapping model attribute names to data storage field names.
     *
     * _Example_
     * ```
     * {
     *   father: 'dad',
     *	 email: 'eml',
     *	 image: 'img',
     *	 displayName: 'dn',
     *	 firstName: 'gn',
     *	 lastName: 'sn',
     *	 middleName: 'mn',
     *	 gender: 'sex',
     *	 dob: 'bd',
     * }
     * ```
     */
    dataMap: NGN.define(true, true, false, config.dataMap || null),

    /**
     * @property {object} raw
     * The raw data.
     * @private
     */
    raw: NGN.define(false, true, false, {}),

    /**
     * @method on
     * Create an event handerl
     */

    /**
      * @method
      * Add or update a validation rule for a specific model property.
      * @param {String} property
      * The property to test.
      * @param {Function/String[]/Number[]/Date[]/RegExp/Array} validator
      * The validation used to test the property value. This should return
      * `true` when the data is valid and `false` when it is not.
      *
      * * When this is a _function_, the value is passed to it as an argument.
      * * When this is a _String_, the value is compared for an exact match (case sensitive)
      * * When this is a _Number_, the value is compared for equality.
      * * When this is a _Date_, the value is compared for exact equality.
      * * When this is a _RegExp_, the value is tested and the results of the RegExp#test are used to validate.
      * * When this is an _Array_, the value is checked to exist in the array, regardless of data type. This is treated as an `enum`.
      * * When this is _an array of dates_, the value is compared to each date for equality.
      * @fires validator.add
      */
    addValidator: NGN.define(true, false, false, function (property, validator) {
      if (!this.hasOwnProperty(property)) {
        console.warn('No validator could be create for ' + property.toUpperCase() + '. It is not an attribute of ' + this.type.toUpperCase() + '.')
        return
      }
      switch (typeof validator) {
        case 'function':
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(validator)
          this.emit('validator.add', property)
          break
        case 'object':
          if (Array.isArray(validator)) {
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.indexOf(value) >= 0
            })
            this.emit('validator.add', property)
          } else if (validator.test) { // RegExp
            this.validators[property] = this.validators[property] || []
            this.validators[property].push(function (value) {
              return validator.test(value)
            })
            this.emit('validator.add', property)
          } else {
            console.warn('No validator could be created for ' + property.toUpperCase() + '. The validator appears to be invalid.')
          }
          break
        case 'string':
        case 'number':
        case 'date':
          this.validators[property] = this.validators[property] || []
          this.validators[property].push(function (value) {
            return value === validator
          })
          this.emit('validator.add', property)
          break
        default:
          console.warn('No validator could be create for ' + property.toUpperCase() + '. The validator appears to be invalid.')
      }
    }),

    /**
      * @method removeValidator
      * Remove a data validator from the object.
      * @param {String} attribute
      * The name of the attribute to remove from the validators.
      * @fires validator.remove
      */
    removeValidator: NGN.define(true, false, false, function (attribute) {
      if (this.validators.hasOwnProperty(attribute)) {
        delete this.validators[attribute]
        this.emit('validator.remove', attribute)
      }
    }),

    /**
      * @method validate
      * Validate one or all attributes of the data.
      * @param {String} [attribute=null]
      * Validate a specific attribute. By default, all attributes are tested.
      * @private
      * @returns {Boolean}
      * Returns true or false based on the validity of data.
      */
    validate: NGN.define(true, false, false, function (attribute) {
      if (this.disableDataValidation) {
        return undefined
      }

      var _pass = true

      // Single Attribute Validation
      if (attribute) {
        if (this.validators.hasOwnProperty(attribute)) {
          _pass = this.validationMap[attribute](this[attribute])
          if (!_pass) {
            this.invalidDataAttributes.push(attribute)
          }
          return _pass
        }
      }

      // Validate All Attributes
      for (var rule in this.validators) {
        if (this[rule]) {
          if (this.validators.hasOwnProperty(rule)) {
            var pass = true
            for (var i = 0; i < this.validators[rule].length; i++) {
              pass = this.validators[rule][i](this[rule])
              if (!pass) {
                break
              }
            }
            if (!pass && this.invalidDataAttributes.indexOf(rule) < 0) {
              this.invalidDataAttributes.push(rule)
            }

            if (_pass && !pass) {
              _pass = false
            }
          }
        }
      }

      return true
    }),

    /**
       * @method enableDataValidation
       * Enable data validation if #disableDataValidation is `true`.
     * @fires validation.disabled
       */
    enableDataValidation: NGN.define(true, false, false, function () {
      this.disableDataValidation = false
      this.emit('validation.enabled')
    }),

    /**
     * @method disableDataValidation
     * Disable data validation. Sets #disableDataValidation to `true`.
     * @fires validation.disabled
     */
//    disableDataValidation: NGN.define(true, false, false, function () {
//      this.disableDataValidation = true
//      this.emit('validation.disabled')
//    }),

    /**
     * @property datafields
     * Provides an array of data fields associated with the model.
     * @returns {String[]}
     */
    datafields: NGN._get(function () {
      var list = []
      for (var field in this.fields) {
        list.push(field)
      }
      return list
    }),

    /**
       * @method
       * Provides specific detail/configuration about a field.
       * @param {String} fieldname
       * The name of the data field.
       * @returns {Object}
       */
    getDataField: NGN.define(true, false, false, function (fieldname) {
      return this.fields[fieldname]
    }),

    /**
     * @method
     * Indicates a data field exists.
     * @param {String} fieldname
     * The name of the data field.
     * @returns {Boolean}
     */
    hasDataField: NGN.define(true, false, false, function (fieldname) {
      return this.fields.hasOwnProperty(fieldname)
    }),

    /**
      * @method record
      * Creates a JSON representation of the data entity. This is
      * a record that can be persisted to a database or other data store.
      * @param {function} callback
      * Executed when the JSON is ready.
      * @param {object} callback.data
      * The data contained in the model.
      */
    record: NGN.define(true, false, false, function (callback) {
      var self = this
      setTimeout(function () {
        callback(self.serialize())
      }, 1)
    }),

    /**
      * @method
      * Creates a JSON data object with no functions. Only uses enumerable attributes of the object by default.
      * Specific data values can be included/excluded using #enumerableProperties & #nonEnumerableProperties.
      *
      * Any object property that begins with a special character will be ignored by default. Functions & Setters are always
      * ignored. Getters are evaluated recursively until a simple object type is found or there are no further nested attributes.
      *
      * If a value is an instance of NGN.model.Model (i.e. a nested model or array of models), reference string is returned in the data.
      * The model itself can be returned using #getXRef.
      * @param {Object} [obj]
      * Defaults to this object.
      * @protected
      */
    serialize: NGN.define(false, false, false, function (obj) {
      var _obj = obj || this.raw
      var rtn = {}

      for (var key in _obj) {
        _obj.nonEnumerableProperties = _obj.nonEnumerableProperties || ''
        if (this.fields.hasOwnProperty(key)) {
          key = key === 'id' ? this.idAttribute : key
          if ((_obj.hasOwnProperty(key) && (_obj.nonEnumerableProperties.indexOf(key) < 0 && /^[a-z0-9 ]$/.test(key.substr(0, 1)))) || (_obj[key] !== undefined && _obj.enumerableProperties.indexOf(key) >= 0)) {
            var dsc = Object.getOwnPropertyDescriptor(_obj, key)
            if (!dsc.set) {
              // Handle everything else
              switch (typeof dsc.value) {
                case 'function':
                  // Support date & regex proxies
                  if (dsc.value.name === 'Date') {
                    rtn[key] = _obj[key].refs.toJSON()
                  } else if (dsc.value.name === 'RegExp') {
                    rtn[key] = dsc.value()
                  }
                  break
                case 'object':
                  // Support array proxies
                  if (_obj[key] instanceof Array && !Array.isArray(_obj[key])) {
                    _obj[key] = _obj[key].slice(0)
                  }

                  rtn[key] = _obj[key]
                  break
                default:
                  rtn[key] = _obj[key]
                  break
              }
            }
          }
        }
      }

      return rtn
    }),

    addField: NGN.define(true, false, false, function (field, suppressEvents) {
      suppressEvents = suppressEvents !== undefined ? suppressEvents : false
      var me = this
      if (['id'].indexOf(field) < 0) {
        if (me[field] !== undefined) {
          console.warn(field + ' data field defined multiple times. Only the last defintion will be used.')
          delete me[field]
        }

        // Create the data field as an object attribute & getter/setter
        me.fields[field] = me.fields[field] || arguments[1] || {}
        me.fields[field] = {
          required: NGN.coalesce(me.fields[field].required, false),
          type: NGN.coalesce(me.fields[field].type, String),
          'default': NGN.coalesce(me.fields[field]['default'], null)
        }
        me.raw[field] = me.fields[field]['default']
        me[field] = me.raw[field]

        Object.defineProperty(me, field, {
          get: function () {
            return me.raw[field]
          },
          set: function (value) {
            var old = me.raw[field]
            me.raw[field] = value
            var c = {
              action: 'update',
              field: field,
              old: old,
              new: me.raw[field]
            }
            this.changelog.push(c)
            me.emit('field.update', c)
          }
        })

        if (!suppressEvents) {
          var c = {
            action: 'create',
            field: field
          }
          this.changelog.push(c)
          this.emit('field.create', c)
        }
        // Add field validators
//        if (!me.disableDataValidation) {
//          if (me.fields[field].hasOwnProperty('pattern')) {
//            me.addValidator(field, me.fields[field].pattern)
//          }
//          ['min', 'max', 'enum'].forEach(function (v) {
//            if (me.fields[field].hasOwnProperty(v)) {
//              me.addValidator(field, function (val) {
//                return me._nativeValidators[v](me.fields[field], val)
//              })
//            }
//          })
//          if (me.fields[field].hasOwnProperty('required')) {
//            if (me.fields[field].required) {
//              me.addValidator(field, function (val) {
//                return me._nativeValidators.required(val)
//              })
//            }
//          }
//          if (me.fields[field].hasOwnProperty('validate')) {
//            if (typeof me.fields[field] === 'function') {
//              me.addValidator(field, function (val) {
//                return me.fields[field](val)
//              })
//            } else {
//              console.warn('Invalid custom validation function. The value passed to the validate attribute must be a function.')
//            }
//          }
//        }
      }
    }),

    removeField: NGN.define(true, false, false, function (name) {
      if (this.raw.hasOwnProperty(name)) {
        var val = this.raw[name]
        delete this[name]
        delete this.fields[name] // eslint-disable-line no-undef
        delete this.raw[name] // eslint-disable-line no-undef
        var c = {
          action: 'delete',
          field: name,
          value: val
        }
        this.emit('field.delete', c)
        this.changelog.push(c)
      }
    }),

//    datamonitor: NGN.define(false, false, false, function (changes) {
//      changes.forEach(function (change) {
//        if (change.name === 'nonEnumerableProperties') {
//          return
//        }
//        switch (change.type) {
//          case 'update':
//            // Run monitors
//            me.changelog.push({
//              action: 'update',
//              old: change.oldValue,
//              new: me[change.name],
//              field: change.name
//            })
//            me.emit('field.update', {
//              old: change.oldValue,
//              new: me[change.name],
//              field: change.name
//            })
//            break
//          case 'add':
//            me.changelog.push({
//              action: 'create',
//              new: me[change.name],
//              field: change.name
//            })
//            me.emit('field.create', {
//              field: change.name,
//              new: me[change.name]
//            })
//            break
//          case 'delete':
//            me.changelog.push({
//              action: 'delete',
//              old: me[change.name],
//              field: change.name
//            })
//            me.emit('field.delete', {
//              field: change.name,
//              old: me[change.name]
//            })
//            break
//          default:
//            console.log(change)
//        }
//      })
//    }),
//
//    modelwatcher: NGN.define(false, false, false, function (changes) {
//      changes.forEach(function (change) {
//        switch (change.type) {
//          // Delegate data updates to data monitor
//          case 'update':
//            if (me.raw.hasOwnProperty(change.name)) {
//              me.raw[change.name] = me[change.name]
//            }
//            break
//
//          // Add a new data field
//          case 'add':
//            var val = me[change.name]
//            Object.unobserve(me, me.modelwatcher)
//            delete me[change.name]
//            me.addField(change.name)
//            me[change.name] = val
//            me.raw[change.name] = val
//            Object.observe(me, me.modelwatcher)
//            me.changelog.push({
//              action: 'create',
//              field: change.name,
//              new: val
//            })
//            break
//
//          // Remove a data field
//          case 'delete':
//            Object.unobserve(me, me.modelwatcher)
//            me.removeField(change.name)
//            Object.observe(me, me.modelwatcher)
//            me.changelog.push({
//              action: 'delete',
//              field: change.name,
//              old: change.oldValue
//            })
//            break
//          default:
//            console.warn(change)
//        }
//      })
//    }),

    /**
     * @method history
     * Get the history of the entity (i.e. changelog).The history
     * is shown from most recent to oldest change. Keep in mind that
     * some actions, such as adding new custom fields on the fly, may
     * be triggered before other updates.
     * @param {function} callback
     * The method to call when the history is available.
     * @param {array} callback.history
     * The array containing the changelog details. The history
     * is shown from most recent to oldest change.
     */
    history: NGN._get(function (callback) {
      return this.changelog.reverse()
    }),

    /**
     * @method undo
     * A rollback function to undo changes. This operation affects
     * the changelog. It is possible to undo an undo (i.e. redo).
     * @param {number} [OperationCount=1]
     * The number of operations to "undo". Defaults to a single operation.
     */
    undo: NGN.define(true, false, false, function (back) {
      back = back || 1
      var old = this.changelog.splice(this.changelog.length - back, back)
      var me = this

      old.reverse().forEach(function (change) {
        switch (change.action) {
          case 'update':
            me[change.field] = change.old
            break
          case 'create':
            me.removeField(change.field)
            break
          case 'delete':
            me.addField(change.field)
            me[change.field] = me.old
            break
        }
      })
    })
  })

  // Make sure an ID reference is available.
  if (!this.fields.hasOwnProperty('id')) {
    config.fields.id = {
      required: true,
      type: String,
      'default':	config.id || null
    }
  }

  // Add fields
  Object.keys(this.fields).forEach(function (field) {
    me.addField(field, true)
  })

  var Entity = function () {
    return me
  }

  return Entity
  // var preGetDataMap = function (next) {
  //   this.dataMap = this.dataMap || {}
  //
  //   var keys= Object.keys(this.fields)
  //
  //   // If the data map doesn't exist, create a default one.
  //   if (Object.keys(this.dataMap).length > 0) {
  //     // Fill in any missing attributes
  //     for (var i=0i<keys.lengthi++) {
  //       if (!this.dataMap.hasOwnProperty(keys[i])) {
  //         Object.defineProperty(this.dataMap,keys[i],{
  //           value: keys[i],
  //           enumerable: true,
  //           writable:	false
  //         })
  //       }
  //     }
  //     return this.dataMap
  //   }
  //
  //   // Pause the precondition
  //   this.removePre('getDataMap')
  //
  //   // Temporarily save the map results from the model method.
  //   var map = this.getDataMap()
  //
  //   // Unpause the precondition
  //   this.pre('getDataMap',preGetDataMap)
  //
  //   // Return the results
  //   return map
  //
  // }

  // Before the getDataMap method is executed.
  // this.pre('getDataMap',preGetDataMap)

  // Auto-fetch
  // if (this[this.idAttribute])
  //	this.fetch()

  // DO NOT CHANGE THIS
  // This is a smart object that returns a proxy if enabled,
  // or a standard object if not enabled.
  // return this.EXTENDEDMODEL
}
