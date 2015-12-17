module.exports = function (position) {
  position = position || 'beforeend'
  document.head.insertAdjacentHTML(position, '<script type="text/javascript" src="' + require('path').join(__dirname, 'dist/chassis.min.js') + '"></script>')
}
