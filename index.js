module.exports = function (callback) {
  if (document) {
    var s = document.createElement('script')
    s.setAttribute('type', 'text/javascript')
    s.setAttribute('src', require('path').join(__dirname, 'dist/chassis.min.js'))
    s.onload = typeof callback === 'function' ? function () { callback() } : function () {}
    document.head.appendChild(s)
  } else {
    console.log('NGN Chassis failed to load: DOM does not exist or was not recognized.')
  }
}
