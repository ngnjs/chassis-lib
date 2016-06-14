'use strict'

window.NGN = window.NGN || {}
window.NGN.DATA = window.NGN.DATA || {}

/**
 * @class NGN.DATA.Model
 * A data model.
 * @extends NGN.DATA.util.EventEmitter
 * @fires field.update
 * Fired when a datafield value is changed.
 * @fires field.create
 * Fired when a datafield is created.
 * @fires field.remove
 * Fired when a datafield is deleted.
 * @fires field.invalid
 * Fired when an invalid value is detected in an data field.
 * @fires relationship.create
 * Fired when a new join field is created.
 * @fires relationship.remove
 * Fired when a join field is removed.
 * @fires reset
 * Fired when the record is marked as "unmodified". This can
 * be used to synchronize joins to other models.
 */
// NGN.DATA.Entity is the core class. NGN.DATA.Model extends
// this transparently.
window.NGN.DATA.Entity = function (config) {
  config = config || {}

  var me = this

  Object.defineProperties(this, {
    /**
     * @cfg {String} [idAttribute='id']
     * Setting this allows an attribute of the object to be used as the ID.
     * For example, if an email is the ID of a user, this would be set to
     * `email`.
     */
    idAttribute: NGN.define(false, false, false, config.idAttribute || 'id'),

    /**
     * @cfg {object} fields
     * A private object containing the data fields of the model, including
     * validators & default values.
     * ```js
     * fields: {
     *   fieldname: {
     *     required: true,
     *     type: String,
     *     default: 'default field value'
     *   },
     *   fieldname2: null // Uses default field config (default value is null)
     * }
     * ```
     */
    /**
     * @datafield {string} [id=null]
     * The unique ID of the person.
     */
    fields: NGN.define(false, true, true, config.fields ||
      {
        id: {
          required: true,
          type: String,
          'default': config.id || null
        }
      }
    ),

    /**
     * @cfg {object|NGN.DATA.Model|NGN.DATA.Store} relationships
     * An object containing fields that reference another data set. This can
     * contain a configuration, an NGN.DATA.Model, or an NGN.DATA.Store.
     * ```js
     * // Metadata
     * relationships: {
     *   fieldname: {
     *     required: true,
     *     ref: MyModel
     *   },
     *   fieldname2: {
     *     required: false,
     *     ref: MyDataStore,
     *     default: {}
     *   }
     * }
     * // or
     * relationships: {
     *   fieldname: MyModel
     * }
     * ```
     * Using the second syntax assumes the field **is required**.
     *
     * It is then possible to reference a join by the fieldname. For example:
     *
     * ```js
     * console.log(MyModel.fieldname.data) // Displays the MyModel data.
     * ```
     * @type {[type]}
     */
    joins: NGN.define(false, true, true, config.relationships || {}),

    /**
     * @property {Object}
     * A private object containing virtual data attributes and generated data.
     * Virtual datafields are derived values. They are not part of the
     * underlying data.
     *
     * **Example:**
     *
     * ```js
     * var Model = new NGN.DATA.Model({
     *   fields: {
     *     dateOfBirth: null
     *   },
     *   virtuals: {
     *     age: function () {
     *       return YearsApart(new Date(), this.dateOfBirth)
     *     }
     *   }
     * })
     * ```
     * The `age` example above compares the `dateOfBirth` field
     * to the current date, expecting a numeric response.
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
      return this.checksum !== this.benchmark
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
        this.oid = value
      }
    },

    /**
     * @cfg {boolean} [autoid=false]
     * If the NGN.DATA.Model#idAttribute/id is not provided for a record,
     * unique ID will be automatically generated for it. This means there
     * will not be a `null` ID.
     *
     * An NGN.DATA.Store using a model with this set to `true` will never
     * have a duplicate record, since the #id or #idAttribute will always
     * be unique.
     */
    autoid: NGN.define(true, false, false, NGN.coalesce(config.autoid, false)),

    /**
     * @property checksum
     * The unique checksum of the record (i.e. a record fingerprint).
     * This will change as the data changes.
     */
    checksum: NGN._get(function () {
      return NGN.DATA.util.checksum(JSON.stringify(this.data))
    }),

    benchmark: NGN.define(false, true, false, null),

    /**
     * @method setUnmodified
     * This method forces the model to be viewed as unmodified, as though
     * the record was just loaded from it's source. This method should only
     * be used when custom loading data. The #load method automatically
     * invokes this when record data is loaded. This also clears the history,
     * just as if the record is brand new.
     * @private
     */
    setUnmodified: NGN.define(false, false, false, function () {
      this.benchmark = this.checksum
      this.changelog = []
      this.emit('reset')
    }),

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
     * @cfgproperty {Object} dataMap
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
    _dataMap: NGN.define(true, true, false, config.dataMap || null),
    _reverseDataMap: NGN.define(true, true, false, null),

    dataMap: {
      get: function () { return this._dataMap },
      set: function (value) {
        this._dataMap = value
        this._reverseDataMap = null
      }
    },

    /**
     * @property {object} reverseMap
     * Reverses the data map. For example, if the original #dataMap
     * looks like:
     *
     * ```js
     * {
     *    firstname: 'gn',
     *    lastname: 'sn
     * }
     * ```
     *
     * The reverse map will look like:
     *
     * ```js
     * {
     *    gn: 'firstname',
     *    sn: 'lastname
     * }
     * ```
     */
    reverseMap: NGN._get(function () {
      if (this.dataMap !== null) {
        if (this._reverseDataMap !== null) {
          return this._reverseDataMap
        }
        var rmap = {}
        Object.keys(this._dataMap).forEach(function (attr) {
          rmap[me._dataMap[attr]] = attr
        })
        this._reverseDataMap = rmap
        return rmap
      }
      return null
    }),

    /**
     * @property {object} raw
     * The raw data.
     * @private
     */
    raw: NGN.define(false, true, false, {}),

    /**
     * @property {object} rawjoins
     * The related data models/stores.
     * @private
     */
    rawjoins: NGN.define(false, true, false, {}),

    _store: NGN.define(false, true, false, null),

    /**
     * @property {NGN.DATA.Store} store
     * If a store is associated with the model, this will
     * provide a reference to it. If there is no store, this
     * will return `null`.
     */
    datastore: NGN._get(function () {
      return this._store
    }),

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

      // Single Attribute Validation
      if (attribute) {
        if (this.validators.hasOwnProperty(attribute)) {
          for (i = 0; i < this.validators[attribute].length; i++) {
            if (!me.validators[attribute][i](me[attribute])) {
              me.invalidDataAttributes.indexOf(attribute) < 0 && me.invalidDataAttributes.push(attribute)
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

    /**
     * @property {boolean} valid
     * Indicates the record is valid.
     */
    valid: NGN._get(function () {
      return this.invalidDataAttributes.length === 0
    }),

    /**
     * @property relationships
     * Provides an array of join fields associated with the model.
     * @returns {String[]}
     */
    relationships: NGN._get(function () {
      return Object.keys(this.joins)
    }),

    /**
     * @method
     * Provides specific detail/configuration about a join/relationship.
     * @param {String} fieldname
     * The name of the field.
     * @returns {Object}
     */
    getRelationshipField: NGN.define(true, false, false, function (fieldname) {
      return this.joins[fieldname]
    }),

    /**
     * @method
     * Indicates a data join exists.
     * @param {String} fieldname
     * The name of the data field.
     * @returns {Boolean}
     */
    hasRelationship: NGN.define(true, false, false, function (fieldname) {
      return this.joins.hasOwnProperty(fieldname)
    }),

    /**
     * @property datafields
     * Provides an array of data fields associated with the model.
     * @returns {String[]}
     */
    datafields: NGN._get(function () {
      return Object.keys(this.fields)
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
     * @property virtualdatafields
     * Provides an array of virtual data fields associated with the model.
     * @returns {String[]}
     */
    virtualdatafields: NGN._get(function () {
      return Object.keys(this.virtuals)
    }),

    /**
      * @property data
      * Creates a JSON representation of the data entity. This is
      * a record that can be persisted to a database or other data store.
      * This automatically serializes join fields.
      * @readonly.
      */
    data: NGN._get(function () {
      var d = this.serialize()
      if (!d.hasOwnProperty(this.idAttribute) && this.autoid) {
        d[this.idAttribute] = this[this.idAttribute]
      }
      if (this.dataMap) {
        // Loop through the map keys
        Object.keys(this.dataMap).forEach(function (key) {
          // If the node contains key, make the mapping
          if (d.hasOwnProperty(key)) {
            if (d[key] instanceof NGN.DATA.Model) {
              d[me.dataMap[key]] = d[key].data
            } else {
              d[me.dataMap[key]] = d[key]
            }
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
        // Handle data fields
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

      this.relationships.forEach(function (r) {
        rtn[r] = me[r].data
      })

      return rtn
    }),

    /**
     * @method addField
     * Add a data field after the initial model definition.
     * @param {string} fieldname
     * The name of the field.
     * @param {object} [fieldonfiguration=null]
     * The field configuration (see cfg#fields for syntax).
     * @param {boolean} [suppressEvents=false]
     * Set to `true` to prevent events from firing when the field is added.
     */
    addField: NGN.define(true, false, false, function (field, fieldcfg, suppressEvents) {
      if (typeof fieldcfg === 'boolean') {
        suppressEvents = fieldcfg
        fieldcfg = null
      }
      suppressEvents = suppressEvents !== undefined ? suppressEvents : false
      if (field.toLowerCase() !== 'id') {
        if (typeof field === 'object') {
          if (!field.name) {
            throw new Error('Cannot create data field. The supplied configuration does not contain a unique data field name.')
          }
          var cfg = field
          field = cfg.name
          delete cfg.name
        }

        if (me[field] !== undefined) {
          console.warn(field + ' data field defined multiple times. Only the last defintion will be used.')
          delete me[field]
        }

        // Create the data field as an object attribute & getter/setter
        me.fields[field] = cfg || me.fields[field] || {}
        me.fields[field].required = NGN.coalesce(me.fields[field].required, false)
        me.fields[field].type = NGN.coalesce(me.fields[field].type, String)
        if (field === me.idAttribute && me.autoid === true) {
          me.fields[field].type = String
          me.fields[field]['default'] = NGN.DATA.util.GUID()
        } else {
          me.fields[field]['default'] = me.fields[field]['default'] || null
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
            this.emit('field.update', c)
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
      } else if (me.id === null && me.autoid) {
        me.id = NGN.DATA.util.GUID()
      }
    }),

    /**
     * @method addVirtual
     * Add a virtual field dynamically.
     * @param {string} name
     * The name of the attribute to add.
     * @param {function} handler
     * The synchronous method (or generator) that produces
     * the desired output.
     */
    addVirtual: NGN.define(true, false, false, function (name, fn) {
      Object.defineProperty(this, name, NGN._get(function () {
        return fn.apply(me)
      }))
    }),

    /**
     * @method addRelationshipField
     * Join another model dynamically.
     * @param {string} name
     * The name of the field to add.
     * @param {Object|NGN.DATA.Model} config
     * The configuration or data model type. This follows the same syntax
     * defined in the #joins attribute.
     * @param {boolean} [suppressEvents=false]
     * Set to `true` to prevent events from firing when the field is added.
     */
    addRelationshipField: NGN.define(true, false, false, function (name, cfg, suppressEvents) {
      suppressEvents = suppressEvents !== undefined ? suppressEvents : false
      if (this.rawjoins.hasOwnProperty(name) || this.fields.hasOwnProperty(name) || this.hasOwnProperty(name)) {
        throw new Error(name + ' already exists. It cannot be added to the model again.')
      }

      if (typeof cfg === 'function' || typeof cfg === 'object' && !cfg.hasOwnProperty('ref')) {
        cfg = {
          ref: cfg
        }
      }

      if (!cfg.ref) {
        throw new Error('Configuration has no reference! The reference must be an NGN.DATA.Model or NGN.DATA.Store.')
      }

      cfg.required = NGN.coalesce(cfg.required, true)
      cfg.default = cfg.default || null

      var me = this
      if (cfg.ref.prototype) {
        this.rawjoins[name] = cfg.default !== null ? new cfg.ref(cfg.default) : new cfg.ref()  // eslint-disable-line new-cap
      } else if (cfg.ref.model) {
        this.rawjoins[name] = cfg.ref
        if (this.rawjoins[name].hasOwnProperty('proxy')) {
          this.rawjoins[name].on('record.create', function (record) {
            var old = me[name].data
            old.pop()
            var c = {
              action: 'update',
              field: name,
              join: true,
              old: old,
              new: me[name].data
            }
            me.emit('field.update', c)
          })
          this.rawjoins[name].on('record.update', function (record, delta) {
            var c = {
              action: 'update',
              field: name + '.' + delta.field,
              join: true,
              old: delta.old,
              new: delta.new
            }
            me.emit('field.update', c)
          })
          this.rawjoins[name].on('record.delete', function (record) {
            var old = me[name].data
            old.push(record.data)
            var c = {
              action: 'update',
              field: name,
              join: true,
              old: old,
              new: me[name].data
            }
            me.emit('field.update', c)
          })
        }
      }

      Object.defineProperty(this, name, {
        enumerable: true,
        get: function () {
          return me.rawjoins[name]
        }
      })

      if (!suppressEvents) {
        var c = {
          action: 'create',
          field: name
        }
        this.changelog.push(c)
        this.emit('relationship.create', c)
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
        if (this.invalidDataAttributes.indexOf(name) >= 0) {
          this.invalidDataAttributes.splice(this.invalidDataAttributes.indexOf(name), 1)
        }
        var c = {
          action: 'delete',
          field: name,
          old: val
        }
        this.emit('field.remove', c)
        this.changelog.push(c)
      }
    }),

    /**
     * @method removeVirtual
     * Remove a virtual field.
     * @param {string} name
     * Name of the field.
     */
    removeVirtual: NGN.define(true, false, false, function (name) {
      delete this[name]
    }),

    /**
     * @method removeRelationshipField
     * Remove an existing join dynamically.
     * @param {string} name
     * The name of the relationship field to remove.
     * @param {boolean} [suppressEvents=false]
     * Set to `true` to prevent events from firing when the field is added.
     */
    removeRelationshipField: NGN.define(true, false, false, function (name, suppressEvents) {
      suppressEvents = suppressEvents !== undefined ? suppressEvents : false
      if (this.joins.hasOwnProperty(name)) {
        var val = this.rawjoins[name]
        delete this.rawjoins[name]
        delete this[name]
        delete this.joins[name]
        if (!suppressEvents) {
          var c = {
            action: 'delete',
            field: name,
            old: val,
            join: true
          }
          this.changelog.push(c)
          this.emit('relationship.remove', c)
        }
      }
    }),

    /**
     * @property history
     * The history of the entity (i.e. changelog).The history
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
     * This works with relationship creating/removing relationship fields,
     * but not updates to the related model. To undo changes to a relationship
     * field, the `undo()` method _of the related model_ must be called.
     * @param {number} [OperationCount=1]
     * The number of operations to "undo". Defaults to a single operation.
     */
    undo: NGN.define(true, false, false, function (back) {
      back = back || 1
      var old = this.changelog.splice(this.changelog.length - back, back)

      old.reverse().forEach(function (change) {
        if (!(typeof change.join === 'boolean' ? change.join : false)) {
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
        } else {
          switch (change.action) {
            case 'create':
              me.removeRelationshipField(change.field)
              break
            case 'delete':
              me.addRelationshipField(change.field)
              me[change.field] = change.old
              break
          }
        }
      })
    }),

    /**
     * @method load
     * Load a data record. This clears the #history. #modified
     * will be set to `false`, as though the record has been untouched.
     * @param {object} data
     * The data to apply to the model.
     */
    load: NGN.define(true, false, false, function (data) {
      data = data || {}

      // Handle data maps
      if (this._dataMap !== null) {
        Object.keys(this.reverseMap).forEach(function (key) {
          if (data.hasOwnProperty(key)) {
            data[me.reverseMap[key]] = data[key]
            delete data[key]
          }
        })
      }

      // Loop through the keys and add data fields
      Object.keys(data).forEach(function (key) {
        if (me.fields.hasOwnProperty(key)) {
          if (me.raw.hasOwnProperty(key)) {
            me.raw[key] = data[key]
          } else if (key === me.idAttribute) {
            me.id = data[key]
          }
        } else if (me.joins.hasOwnProperty(key)) {
          var tmp = new me.getRelated(key).type() // eslint-disable-line new-cap
          tmp.load(data[key])
          me.rawjoin[key] = tmp
        } else {
          console.warn(key + ' was specified as a data field but is not defined in the model.')
        }
      })

      this.setUnmodified()
    })
  })

  // Make sure there aren't duplicate field names defined (includes joins)
  var allfields = this.datafields.concat(this.virtualdatafields).concat(this.relationships).filter(function (key, i, a) {
    return a.indexOf(key) !== i
  })

  if (allfields.length > 0) {
    throw new Error('Duplicate field names exist: ' + allfields.join(', ') + '. Unique fieldnames are required for data fields, virtuals, and relationship fields.')
  }

  // Make sure an ID reference is available.
  if (!this.fields.hasOwnProperty('id')) {
    config.fields.id = {
      required: true,
      type: String,
      'default': config.id || null
    }
  }

  // Add fields
  Object.keys(this.fields).forEach(function (field) {
    me.addField(field, true)
  })

  // Add virtuals
  Object.keys(this.virtuals).forEach(function (v) {
    Object.defineProperty(me, v, NGN._get(function () {
      return me.virtuals[v].apply(me)
    }))
  })

  // Add relationships
  Object.keys(this.joins).forEach(function (field) {
    me.addRelationshipField(field, me.joins[field], true)
  })

  this.setUnmodified()
}

window.NGN.DATA.Model = function (cfg) {
  var Model = function (data) {
    this.constructor(cfg)
    if (data) {
      this.load(data)
    }
  }

  // Model.prototype = NGN.DATA.Entity.prototype
  NGN.DATA.util.inherit(NGN.DATA.Entity, Model)

  return Model
}

NGN.DATA.util.inherit(NGN.DATA.util.EventEmitter, NGN.DATA.Entity)
