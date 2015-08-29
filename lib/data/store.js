window.DATA = window.DATA || {};

/**
 * @class DATA.Store
 * Represents a collection of data.
 */
window.DATA.Store = function(cfg){
  cfg = cfg || {};

  Object.defineProperties(this,{

    model: {
      enumerable: true,
      writable: false,
      configurable: false,
      value: ''
    }

  });

};
