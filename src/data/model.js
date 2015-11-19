'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class DATA.Model
 * A data model.
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.delete
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 */
window.NGN.DATA.Model = function (config) {
  config = config || {}

  var me = this

  Object.defineProperties(this, {

    emit: NGN.define(false, false, false, function (topic) {
      if (window.NGN.BUS) {
        NGN.BUS.emit.apply(NGN.BUS, arguments)
      } else {
        !config.disableEventOutput && console.info(topic)
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
     * @cfgproperty {boolean} [validation=true]
     * Toggle data validation using this.
     */
    validation: NGN.define(true, true, false, NGN.coalesce(config.validation, true)),

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
    modified: NGN._get(function () {
      return this.changelog.length > 0
    }),

    /**
     * @property {String} [oid=null]
     * The raw object ID, which is either the #id or #idAttribute depending
     * on how the object is configured.
     * @private
     */
    oid: NGN.define(false, true, true, config[this.idAttribute] || null),

    /**
     * @cfgproperty {String/Number/Date} [id=null]
     * The unique ID of the model object. If #idAttribute is defined,
     * this will get/set the #idAttribute value.
     */
    id: {
      enumerable: true,
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
     * @property {array} changelog
     * An ordered array of changes made to the object data properties.
     * This cannot be changed manually. Instead, use #history
     * and #undo to manage this list.
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
      * @method addValidator
      * Add or update a validation rule for a specific model property.
      * @param {String} field
      * The data field to test.
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
      var _pass = true
      var me = this

      // Single Attribute Validation
      if (attribute) {
        if (this.validators.hasOwnProperty(attribute)) {
          for (i = 0; i < this.validators[attribute].length; i++) {
            if (!me.validators[attribute][i](me[attribute])) {
              me.invalidDataAttributes.push(attribute)
              return false
            }
          }
          return true
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

    valid: NGN._get(function () {
      return this.invalidDataAttributes.length === 0
    }),

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
      * @property record
      * Creates a JSON representation of the data entity. This is
      * a record that can be persisted to a database or other data store.
      * @readonly.
      */
    record: NGN._get(function () {
      var d = this.serialize()
      if (this.dataMap) {
        // Loop through the map keys
        var me = this
        Object.keys(this.dataMap).forEach(function (key) {
          // If the node contains key, make the mapping
          if (d.hasOwnProperty(key)) {
            d[me.dataMap[key]] = d[key]
            delete d[key]
          }
        })
      }
      return d
    }),

    /**
      * @method serialize
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
      if (field.toLowerCase() !== 'id') {
        if (me[field] !== undefined) {
          console.warn(field + ' data field defined multiple times. Only the last defintion will be used.')
          delete me[field]
        }

        // Create the data field as an object attribute & getter/setter
        me.fields[field] = me.fields[field] || {}
        me.fields[field].required = NGN.coalesce(me.fields[field].required, false)
        me.fields[field].type = NGN.coalesce(me.fields[field].type, String)
        me.fields[field].default = NGN.coalesce(me.fields[field]['default'], null)
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
            if (!me.validate(field)) {
              me.emit('field.invalid', {
                field: field
              })
            }
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
        if (me.fields.hasOwnProperty(field)) {
          if (me.fields[field].hasOwnProperty('pattern')) {
            me.addValidator(field, me.fields[field].pattern)
          }
          ['min', 'max', 'enum'].forEach(function (v) {
            if (me.fields[field].hasOwnProperty(v)) {
              me.addValidator(field, function (val) {
                return me._nativeValidators[v](me.fields[field], val)
              })
            }
          })
          if (me.fields[field].hasOwnProperty('required')) {
            if (me.fields[field].required) {
              me.addValidator(field, function (val) {
                return me._nativeValidators.required(val)
              })
            }
          }
          if (me.fields[field].hasOwnProperty('validate')) {
            if (typeof me.fields[field] === 'function') {
              me.addValidator(field, function (val) {
                return me.fields[field](val)
              })
            } else {
              console.warn('Invalid custom validation function. The value passed to the validate attribute must be a function.')
            }
          }
        }
      }
    }),

    /**
     * @method removeField
     * Remove a field from the data model.
     * @param {string} name
     * Name of the field to remove.
     */
    removeField: NGN.define(true, false, false, function (name) {
      if (this.raw.hasOwnProperty(name)) {
        var val = this.raw[name]
        delete this[name]
        delete this.fields[name] // eslint-disable-line no-undef
        delete this.raw[name] // eslint-disable-line no-undef
        if (this.invalidDataAttributes.indexOf(name)) {
          this.invalidDataAttributes.splice(this.invalidDataAttributes.indexOf(name), 1)
        }
        var c = {
          action: 'delete',
          field: name,
          value: val
        }
        this.emit('field.delete', c)
        this.changelog.push(c)
      }
    }),

    /**
     * @method history
     * Get the history of the entity (i.e. changelog).The history
     * is shown from most recent to oldest change. Keep in mind that
     * some actions, such as adding new custom fields on the fly, may
     * be triggered before other updates.
     * @returns {array}
     */
    history: NGN._get(function () {
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
}
