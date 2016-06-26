// Polyfill for IE11 & Safari
// This is required to make the remove method work properly.
if (!Array.prototype.findIndex) {
  Array.prototype.findIndex = function (predicate) { // eslint-disable-line no-extend-native
    if (this === null) {
      throw new Error('Array.prototype.findIndex called on null or undefined')
    }
    // if (typeof predicate !== 'function') {
    //   throw new Error('Predicate must be a function (received ' + (typeof predicate) + ')')
    // }
    var list = Object(this)
    var length = list.length >>> 0
    var thisArg = arguments[1]
    var value

    for (var i = 0; i < length; i++) {
      value = list[i]
      if (predicate.call(thisArg, value, i, list)) {
        return i
      }
    }
    return -1
  }
}
