'use strict'

Object.defineProperty(NGN, 'global', NGN.privateconst(NGN.nodelike ? global : window))

// Force scope
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('ngn')
})
